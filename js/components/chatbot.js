import { evaluateAnswer, getChatResponse } from '../utils/api-client.js';

export class Chatbot {
    constructor(historyId, inputId, submitId, gameState) {
        console.log(`[Chatbot] Initializing with IDs: ${historyId}, ${inputId}, ${submitId}`);
        this.historyElement = document.getElementById(historyId);
        this.inputElement = document.getElementById(inputId);
        this.submitButton = document.getElementById(submitId);
        console.log("[Chatbot] Elements found:", {
            history: !!this.historyElement,
            input: !!this.inputElement,
            submit: !!this.submitButton
        });
        
        if (!this.historyElement || !this.inputElement || !this.submitButton) {
             console.error("[Chatbot] CRITICAL: One or more chat elements not found in the DOM!");
             return; 
        }
        
        this.gameState = gameState;
        this.onMessageCallbacks = [];
        this.onTaskCompleteCallbacks = [];

        this.attachEvents();
    }

    attachEvents() {
        this.submitButton.addEventListener('click', () => {
            console.log("[Chatbot] Submit button clicked.");
            this.handleUserInput();
        });
        this.inputElement.addEventListener('keypress', event => {
            if (event.key === 'Enter') {
                console.log("[Chatbot] Enter key pressed in input.");
                this.handleUserInput();
            }
        });
    }

    async handleUserInput() {
        console.log("[Chatbot] handleUserInput called.");
        
        const userMessage = this.inputElement.value.trim();
        console.log(`[Chatbot] User message entered: '${userMessage}'`);
        if (!userMessage) {
            console.log("[Chatbot] User message is empty, returning.");
            return;
        }

        const currentTaskId = this.gameState.getCurrentTaskId();
        console.log(`[Chatbot] Current Task ID: ${currentTaskId}`);
        if (!currentTaskId) {
            console.error("[Chatbot] Cannot process message: No current task set.");
            return;
        }

        this.addMessage('user', userMessage);
        this.gameState.addChatMessageToCurrentTask('user', userMessage);
        this.inputElement.value = '';

        const isTaskCompleted = this.gameState.isTaskCompleted(currentTaskId);
        console.log(`[Chatbot] Is Task Completed? ${isTaskCompleted}`);
        const currentTask = this.gameState.getTaskById(currentTaskId);
        console.log(`[Chatbot] Current Task Object:`, currentTask);

        if (!currentTask) {
             console.error(`[Chatbot] Could not find task object for ID: ${currentTaskId}`);
             this.respondToUser("Sorry, there was an internal error retrieving task details.");
             return;
        }
        
        try {
            let botResponseText = ''; 
            let evaluationSucceeded = false; // Flag to track if evaluation succeeded

            if (!isTaskCompleted) {
                // Use api-client
                const data = await evaluateAnswer(currentTask.question, currentTask.correctAnswer, userMessage);
                console.log("[Chatbot] /evaluate Response Data:", data);

                // Display evaluation message immediately if correct
                if (data.flag) {
                    evaluationSucceeded = true; // Mark as succeeded
                    this.respondToUser(data.message); // Display evaluation success message FIRST

                    const { completed, nextTaskId } = this.gameState.completeTask(currentTaskId);
                    if (completed) {
                        // Clear the stored chat history for this task before the initial chat call
                        this.gameState.clearChatHistoryForTask(currentTaskId);
                        console.log(`[Chatbot] Cleared stored chat history for task ${currentTaskId}.`);

                        // Call /chat with no history/message immediately after completion
                        try {
                            console.log("[Chatbot] Task completed. Making initial /chat call (no history/message).");
                            const topic = (currentTask.dataType === 'tree' ? 'trees' : currentTask.dataType) || 'general';
                            const initialChatData = await getChatResponse([], '', topic);
                            console.log("[Chatbot] Initial /chat Response Data:", initialChatData);
                            // Display the initial chat message SECOND
                            this.respondToUser(initialChatData.message); 
                        } catch (chatError) {
                            console.error("[Chatbot] Error during initial /chat call:", chatError.message || chatError);
                            // Decide if you want to show an error message to the user here
                        }
                        
                        // Notify listeners about task completion AFTER initial chat message is sent
                        this.onTaskCompleteCallbacks.forEach(callback => callback(currentTaskId, nextTaskId));
                    }
                } else {
                    // If evaluation failed, store the message for later display
                    botResponseText = data.message;
                }
            } else {
                // Task was already completed, proceed with normal chat
                console.log("[Chatbot] Task is complete, calling /chat via api-client");
                const history = this.gameState.getCurrentTaskChatHistory()
                                    .filter(msg => msg.sender === 'user')
                                    .map(msg => msg.text);
                const previousHistory = history.slice(0, -1);
                console.log("[Chatbot] Sending previous history to /chat:", previousHistory);
                console.log("[Chatbot] Sending current message to /chat:", userMessage);
                const topic = (currentTask.dataType === 'tree' ? 'trees' : currentTask.dataType) || 'general';
                console.log("[Chatbot] Sending topic to /chat:", topic);

                // Use api-client
                const chatData = await getChatResponse(previousHistory, userMessage, topic);
                console.log("[Chatbot] /chat Response Data:", chatData);
                botResponseText = chatData.message; // Store chat message for later display
            }

            // Display bot response ONLY if evaluation did NOT succeed (or if task was already done)
            if (!evaluationSucceeded && botResponseText) {
                this.respondToUser(botResponseText);

                // Requirement 2: Flash map if evaluation failed
                if (!isTaskCompleted && !evaluationSucceeded) { // Ensure this runs only on failed evaluation, not during normal chat
                    console.log("[Chatbot] Evaluation failed, triggering map highlight on container.");
                    const mapContainerElement = document.querySelector('.map-container'); // Select container
                    if (mapContainerElement) {
                        mapContainerElement.classList.add('map-highlight');
                        // Remove the class after the animation finishes (defined in css/main.css)
                        setTimeout(() => {
                            mapContainerElement.classList.remove('map-highlight');
                        }, 2400); // Match the duration in main.js and CSS animation (1.2s * 2)
                    }
                }
            }

        } catch (error) {
            console.error("[Chatbot] Error communicating with backend via api-client:", error.message || error);
            this.respondToUser("Sorry, I encountered an error processing your message. Please try again.");
        }
    }

    addMessage(sender, text) {
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${sender}-message`;
        const textNode = document.createTextNode(text);
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.appendChild(textNode);
        messageElement.appendChild(contentDiv);
        this.historyElement.appendChild(messageElement);
        this.historyElement.scrollTop = this.historyElement.scrollHeight;
    }

    respondToUser(text) {
        setTimeout(() => {
            this.addMessage('bot', text);
            this.gameState.addChatMessageToCurrentTask('bot', text);
        }, 300);
    }

    clearHistory() {
        this.historyElement.innerHTML = '';
        console.log("[Chatbot] Cleared chat history display.");
    }

    loadHistory(historyArray) {
        this.clearHistory();
        console.log("[Chatbot] Loading chat history:", historyArray);
        if (historyArray && historyArray.length > 0) {
            historyArray.forEach(message => {
                this.addMessage(message.sender, message.text);
            });
             console.log("[Chatbot] Finished loading history.");
        } else {
            console.log("[Chatbot] No history to load or history is empty.");
        }
        this.historyElement.scrollTop = this.historyElement.scrollHeight;
    }

    registerUserMessageListener(callback) {
        this.onMessageCallbacks.push(callback);
    }

    registerTaskCompleteListener(callback) {
        this.onTaskCompleteCallbacks.push(callback);
    }
}