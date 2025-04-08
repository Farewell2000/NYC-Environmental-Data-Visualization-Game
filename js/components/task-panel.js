export class TaskPanel {
    constructor(containerId, descriptionId, progressId) {
        this.container = document.getElementById(containerId);
        this.descriptionElement = document.getElementById(descriptionId);
        this.progressElement = document.getElementById(progressId);
        this.currentTask = null;
    }
    
    setTask(task) {
        console.log('[TaskPanel] setTask received task:', task);
        if (!this.descriptionElement) {
            console.error('[TaskPanel] Description element not found!');
            return;
        }
        if (!task) {
            console.error('[TaskPanel] setTask received invalid task:', task);
            this.descriptionElement.innerHTML = '<p>Error: Could not load task details.</p>';
            return;
        }
        if (!task.title || !task.description) {
            console.warn('[TaskPanel] Task object missing title or description:', task);
        }

        this.currentTask = task;
        this.descriptionElement.innerHTML = `
            <h3>${task.title || 'Untitled Task'}</h3>
            <p>${task.description || 'No description available.'}</p>
        `;

        console.log('[TaskPanel] Updated descriptionElement innerHTML');
        this.updateProgress(task.progress || 0);
    }
    
    updateProgress(progress) {
        if (!this.currentTask) return;
        
        this.currentTask.progress = progress;
        this.progressElement.innerHTML = `
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
            <div class="progress-text">${progress}% Complete</div>
        `;
        
        if (progress >= 100) {
            this.container.classList.add('completed');
            setTimeout(() => {
                this.container.classList.remove('completed');
            }, 3000);
        }
    }
}