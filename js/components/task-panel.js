export class TaskPanel {
    constructor(containerId, gameState) {
        this.container = document.getElementById(containerId);
        this.gameState = gameState;
        this.onTaskSelectCallback = null; // Callback when a task is selected
        if (!this.container) {
            console.error(`[TaskPanel] Container element with ID '${containerId}' not found!`);
        }
    }

    renderTasks() {
        if (!this.container) return;
        console.log("[TaskPanel] Rendering tasks...");
        this.container.innerHTML = ''; // Clear existing content

        const allTasks = this.gameState.getAllTasks();
        const currentTaskId = this.gameState.getCurrentTaskId();

        if (!allTasks || allTasks.length === 0) {
             console.warn("[TaskPanel] No tasks available to render.");
            this.container.innerHTML = '<p>No tasks available.</p>';
            return;
        }

        allTasks.forEach((task, index) => {
            const taskCard = document.createElement('div');
            taskCard.classList.add('task-card');
            taskCard.dataset.taskId = task.id;

            const isCurrent = task.id === currentTaskId;
            const isCompleted = this.gameState.isTaskCompleted(task.id);
            const isSelectable = this.gameState.isTaskSelectable(task.id);
            const isFuture = !isSelectable && !isCompleted; // A task is future if it's not selectable and not completed

            taskCard.innerHTML = `
                <h4>${task.title || 'Untitled Task'}</h4>
                <p class="task-card-status"></p> 
            `; // Keep it simple
            // Removed description and progress bar for simplified view

            const statusElement = taskCard.querySelector('.task-card-status');

            if (isCurrent) {
                taskCard.classList.add('current');
                statusElement.textContent = 'Status: Current';
            } else if (isCompleted) {
                taskCard.classList.add('completed');
                statusElement.textContent = 'Status: Completed';
                taskCard.style.backgroundColor = 'lightgreen'; // Mark completed tasks green
            } else if (isFuture) {
                taskCard.classList.add('future', 'disabled'); // Add 'disabled' class
                statusElement.textContent = 'Status: Locked';
            } else {
                 // Should be selectable if it's the first task or the previous is complete
                 statusElement.textContent = 'Status: Available';
            }

            // Add click listener only if the task is selectable
            if (isSelectable) {
                // Remove previous listener if exists (important for re-renders)
                if(taskCard.clickHandler) {
                    taskCard.removeEventListener('click', taskCard.clickHandler);
                }
                const newListener = () => {
                    console.log(`[TaskPanel] Task card clicked: ${task.id}`);
                    if (this.onTaskSelectCallback) {
                        this.onTaskSelectCallback(task.id);
                    }
                };
                taskCard.addEventListener('click', newListener);
                taskCard.clickHandler = newListener; // Store reference to remove later
            } else {
                // Task is not selectable (future/locked)
                taskCard.classList.add('future', 'disabled');
                statusElement.textContent = 'Status: Locked';
                taskCard.style.opacity = '0.6';
                taskCard.style.cursor = 'not-allowed';
                // Ensure no click listener is attached
                if(taskCard.clickHandler) {
                    taskCard.removeEventListener('click', taskCard.clickHandler);
                    taskCard.clickHandler = null;
                }
            }

            this.container.appendChild(taskCard);
        });
         console.log("[TaskPanel] Finished rendering tasks.");
    }

    // Set the callback function to be called when a task is selected
    onTaskSelect(callback) {
        this.onTaskSelectCallback = callback;
    }

    // Method to update a specific task card's appearance (e.g., on completion)
    updateTaskCard(taskId) {
        const taskCard = this.container.querySelector(`.task-card[data-task-id="${taskId}"]`);
        if (!taskCard) return;

        const task = this.gameState.getTaskById(taskId);
        if (!task) return;

        const isCompleted = this.gameState.isTaskCompleted(taskId);
        const statusElement = taskCard.querySelector('.task-card-status');
        const isSelectable = this.gameState.isTaskSelectable(taskId);

         // Reset classes potentially added before
         taskCard.classList.remove('current', 'completed', 'future', 'disabled');
         taskCard.style.backgroundColor = ''; // Reset background
         taskCard.style.opacity = '1';
         taskCard.style.cursor = 'pointer'; // Assume clickable unless proven otherwise

        if (taskId === this.gameState.getCurrentTaskId()) {
            taskCard.classList.add('current');
            statusElement.textContent = 'Status: Current';
        } else if (isCompleted) {
            taskCard.classList.add('completed');
            statusElement.textContent = 'Status: Completed';
            taskCard.style.backgroundColor = 'lightgreen';
        } else {
             // Check if it's now become a future task (shouldn't happen often here)
             // Or if it's just an available past/initial task
             statusElement.textContent = 'Status: Available';
        }

        // Handle click listener and styles based on selectability
        if (taskCard.clickHandler) {
            taskCard.removeEventListener('click', taskCard.clickHandler);
            taskCard.clickHandler = null; // Clear old reference
        }

        if (isSelectable) {
             const newListener = () => {
                console.log(`[TaskPanel] Task card clicked: ${taskId}`);
                if (this.onTaskSelectCallback) {
                    this.onTaskSelectCallback(taskId);
                }
            };
            taskCard.addEventListener('click', newListener);
            taskCard.clickHandler = newListener; // Store the listener reference
        } else {
            // If not selectable AND not completed, it's locked/future
            if (!isCompleted) { 
                taskCard.classList.add('future', 'disabled');
                statusElement.textContent = 'Status: Locked';
                taskCard.style.opacity = '0.6';
                taskCard.style.cursor = 'not-allowed';
            }
            // Otherwise, it might be completed (handled above) or unselectable for another reason
            // (which shouldn't happen with current logic, but good to be robust)
        }
    }

    // Method to refresh the entire panel based on current game state
    refresh() {
        this.renderTasks();
    }
}