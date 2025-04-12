export class DialogueWindow {
    constructor(containerId, avatarId, textId) {
        this.container = document.getElementById(containerId);
        this.avatar = document.getElementById(avatarId);
        this.textElement = document.getElementById(textId);
    }

    setAvatar(avatarUrl) {
        this.avatar.src = avatarUrl;
    }

    speak(text) {
        if (text && text.trim() !== '') {
            this.textElement.innerHTML = text;
            this.container.classList.add('active');
        } else {
            this.textElement.innerHTML = '';
        }
    }

    hide() {
        this.container.classList.remove('active');
    }
}