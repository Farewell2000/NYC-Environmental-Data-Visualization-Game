import { evaluateAnswer, getChatResponse } from '../utils/api-client.js';

export class Chatbot {
    constructor(historyId, inputId, submitId, gameState) {
        this.historyElement = document.getElementById(historyId);
        this.inputElement = document.getElementById(inputId);
        this.submitButton = document.getElementById(submitId);
        
        if (!this.historyElement || !this.inputElement || !this.submitButton) {
             console.error("[Chatbot] CRITICAL: One or more chat elements not found in the DOM!");
             return; 
        }
        
        this.gameState = gameState;
        this.onTaskCompleteCallbacks = [];

        this.attachEvents();
    }

    attachEvents() {
        this.submitButton.addEventListener('click', () => {
            this.handleUserInput();
        });
        this.inputElement.addEventListener('keypress', event => {
            if (event.key === 'Enter') {
                this.handleUserInput();
            }
        });
    }

    async handleUserInput() {
        const userMessage = this.inputElement.value.trim();
        if (!userMessage) {
            return;
        }

        const currentTaskId = this.gameState.getCurrentTaskId();
        if (!currentTaskId) {
            console.error("[Chatbot] Cannot process message: No current task set.");
            return;
        }

        // Display the user message first (addMessage will also save it by default)
        this.addMessage('user', userMessage); 
        // No need to call gameState.addChatMessageToCurrentTask again, as addMessage does it
        this.inputElement.value = '';

        const isTaskCompleted = this.gameState.isTaskCompleted(currentTaskId);
        const currentTask = this.gameState.getTaskById(currentTaskId);
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

                // Display evaluation message immediately if correct
                if (data.flag) {
                    evaluationSucceeded = true; // Mark as succeeded
                    this.respondToUser(data.message); // Display evaluation success message FIRST

                    const { completed, nextTaskId } = this.gameState.completeTask(currentTaskId);
                    if (completed) {
                        // Call /chat with no history/message immediately after completion
                        try {
                            const topic = (currentTask.dataType === 'tree' ? 'trees' : currentTask.dataType) || 'general';
                            const initialChatData = await getChatResponse([], '', topic);
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
                const history = this.gameState.getCurrentTaskChatHistory()
                                    .filter(msg => msg.sender === 'user')
                                    .map(msg => msg.text);
                const previousHistory = history.slice(0, -1);

                // Use api-client
                const chatData = await getChatResponse(previousHistory, userMessage, topic);
                botResponseText = chatData.message; // Store chat message for later display
            }

            // Display bot response ONLY if evaluation did NOT succeed (or if task was already done)
            if (!evaluationSucceeded && botResponseText) {
                this.respondToUser(botResponseText);

                // Requirement 2: Flash map if evaluation failed
                if (!isTaskCompleted && !evaluationSucceeded) { // Ensure this runs only on failed evaluation, not during normal chat
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

    addMessage(sender, text, saveToState = true) {
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${sender}-message`;
        const textNode = document.createTextNode(text);
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.appendChild(textNode);
        messageElement.appendChild(contentDiv);
        this.historyElement.appendChild(messageElement);
        this.historyElement.scrollTop = this.historyElement.scrollHeight;

        if (saveToState) {
            this.gameState.addChatMessageToCurrentTask(sender, text);
        }
    }

    respondToUser(text) {
        setTimeout(() => {
            this.addMessage('bot', text);
        }, 300);
    }

    clearHistory() {
        this.historyElement.innerHTML = '';
    }

    // Internal helper to create and append a message element without saving state
    _displayMessage(sender, text) {
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${sender}-message`;
        const textNode = document.createTextNode(text);
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.appendChild(textNode);
        messageElement.appendChild(contentDiv);
        this.historyElement.appendChild(messageElement);
    }

    loadHistory(historyArray, initialMessage = null) {
        this.clearHistory(); // Clear display first
        
        // Add initial message if provided (like instructions)
        if (initialMessage) {
            this._displayMessage('bot', initialMessage); // Use internal display method
        }

        // Load actual stored history
        if (historyArray && historyArray.length > 0) {
            historyArray.forEach(message => {
                this._displayMessage(message.sender, message.text);
            });
        }
        this.historyElement.scrollTop = this.historyElement.scrollHeight; // Scroll to bottom
    }

    registerTaskCompleteListener(callback) {
        this.onTaskCompleteCallbacks.push(callback);
    }
}