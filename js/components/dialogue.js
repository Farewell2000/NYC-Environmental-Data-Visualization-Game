export class DialogueWindow {
    constructor(containerId, avatarId, textId) {
        this.container = document.getElementById(containerId);
        this.avatar = document.getElementById(avatarId);
        this.textElement = document.getElementById(textId);
        this.dialogueQueue = [];
        this.isSpeaking = false;
    }
    
    setAvatar(avatarUrl) {
        this.avatar.src = avatarUrl;
    }
    
    speak(text, duration = 3000) {
        return new Promise(resolve => {
            this.dialogueQueue.push({ text, duration, resolve });
            if (!this.isSpeaking) {
                this.processQueue();
            }
        });
    }
    
    async processQueue() {
        if (this.dialogueQueue.length === 0) {
            this.isSpeaking = false;
            return;
        }
        
        this.isSpeaking = true;
        const { text, duration, resolve } = this.dialogueQueue.shift();
        
        // Show text with typing animation
        this.textElement.innerHTML = '';
        this.container.classList.add('active');
        
        // Typing animation
        for (let i = 0; i < text.length; i++) {
            this.textElement.innerHTML += text.charAt(i);
            await new Promise(r => setTimeout(r, 20));
        }
        
        // Wait for specified duration
        await new Promise(r => setTimeout(r, duration));
        
        // Complete the dialogue
        resolve();
        
        // Process next in queue
        this.processQueue();
    }
    
    hide() {
        this.container.classList.remove('active');
    }
}