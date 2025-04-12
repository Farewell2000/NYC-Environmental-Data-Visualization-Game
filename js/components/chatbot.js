export class Chatbot {
    constructor(historyId, inputId, submitId, gameState) {
        this.historyElement = document.getElementById(historyId);
        this.inputElement = document.getElementById(inputId);
        this.submitButton = document.getElementById(submitId);
        this.gameState = gameState;
        this.onMessageCallbacks = [];

        this.attachEvents();
    }

    attachEvents() {
        this.submitButton.addEventListener('click', () => this.sendMessage());
        this.inputElement.addEventListener('keypress', event => {
            if (event.key === 'Enter') {
                this.sendMessage();
            }
        });
    }

    sendMessage() {
        const userMessage = this.inputElement.value.trim();
        if (!userMessage) return;

        // Add user message to chat history display
        this.addMessage('user', userMessage);
        // Save user message to game state
        this.gameState.addChatMessageToCurrentTask('user', userMessage);

        // Clear input field
        this.inputElement.value = '';

        // Notify listeners about new message
        this.onMessageCallbacks.forEach(callback => {
            const response = callback(userMessage);
            if (response) {
                this.respondToUser(response);
            }
        });
    }

    addMessage(sender, text) {
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${sender}-message`;
        messageElement.innerHTML = `<div class="message-content">${text}</div>`;
        this.historyElement.appendChild(messageElement);
        this.historyElement.scrollTop = this.historyElement.scrollHeight;
    }

    respondToUser(text) {
        // Add bot message to chat history display
        setTimeout(() => {
            this.addMessage('bot', text);
            // Save bot message to game state
            this.gameState.addChatMessageToCurrentTask('bot', text);
        }, 300); // Add slight delay for natural feel
    }

    // --- History Management ---

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
         // Ensure scroll is at the bottom after loading
        this.historyElement.scrollTop = this.historyElement.scrollHeight;
    }

    // --- Event Listener ---

    onMessage(callback) {
        this.onMessageCallbacks.push(callback);
    }
}