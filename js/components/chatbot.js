export class Chatbot {
    constructor(historyId, inputId, submitId) {
        this.historyElement = document.getElementById(historyId);
        this.inputElement = document.getElementById(inputId);
        this.submitButton = document.getElementById(submitId);
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
        
        // Add user message to chat history
        this.addMessage('user', userMessage);
        
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
        // Add bot message to chat history
        setTimeout(() => {
            this.addMessage('bot', text);
        }, 500); // Add slight delay for natural feel
    }
    
    onMessage(callback) {
        this.onMessageCallbacks.push(callback);
    }
}