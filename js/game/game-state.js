export class GameState {
    constructor() {
        this.state = {
            allTasks: [], // Store all tasks
            completedTaskIds: new Set(), // Store IDs of completed tasks
            currentTaskId: null, // ID of the currently active task
            chatHistories: {}, // { taskId: [{ sender: 'user'/'bot', text: '...' }, ...] }
            userData: {
                points: 0,
            },
            mapState: {
                selectedBorough: null,
                selectedYear: null,
                selectedNoiseType: null,
            }
        };
        // Store task objects by ID for quick lookup
        this._taskLookup = {};
    }
    
    initialize(tasks = []) {
        console.log("Initializing GameState with tasks.");
        this.state.allTasks = tasks;
        this.state.completedTaskIds = new Set();
        this.state.currentTaskId = tasks.length > 0 ? tasks[0].id : null; // Start with the first task
        this.state.chatHistories = {};
        this.state.userData.points = 0;
        this.state.mapState = {
            selectedBorough: null,
            selectedYear: null,
            selectedNoiseType: null,
        };
        this._taskLookup = tasks.reduce((acc, task) => {
            acc[task.id] = task;
            return acc;
        }, {});

        // Initialize empty chat history for each task
        tasks.forEach(task => {
            this.state.chatHistories[task.id] = [];
        });

        console.log("GameState initialized. Current Task:", this.state.currentTaskId);
    }
    
    // Helper function for deep merging state objects
    _deepMerge(target, source) {
        for (const key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
                const targetValue = target[key];
                const sourceValue = source[key];

                if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue) && 
                    targetValue && typeof targetValue === 'object' && !Array.isArray(targetValue)) {
                    this._deepMerge(targetValue, sourceValue); // Recurse for nested objects
                } else {
                    target[key] = sourceValue; // Overwrite or set new value
                }
            }
        }
        return target;
    }

    updateState(partialState) {
        this.state = this._deepMerge({ ...this.state }, partialState);
        console.log("GameState updated:", this.state); // Add logging
    }
    
    getTaskById(taskId) {
        return this._taskLookup[taskId];
    }

    getAllTasks() {
        return this.state.allTasks;
    }

    getCurrentTaskId() {
        return this.state.currentTaskId;
    }

    setCurrentTask(taskId) {
        if (this._taskLookup[taskId]) {
            // Ensure task exists and is not a future task (unless it's the very first one)
            const taskIndex = this.state.allTasks.findIndex(t => t.id === taskId);
            const isCompleted = this.isTaskCompleted(taskId);
            let isAllowed = false;

            if (taskIndex === 0) { // First task is always selectable initially
                isAllowed = true;
            } else if (isCompleted) { // Past tasks are selectable
                isAllowed = true;
            } else {
                 // Check if the *previous* task is completed to allow selection
                 const previousTaskIndex = taskIndex - 1;
                 if (previousTaskIndex >= 0) {
                     const previousTaskId = this.state.allTasks[previousTaskIndex].id;
                     if (this.isTaskCompleted(previousTaskId)) {
                         isAllowed = true;
                     }
                 }
            }


            if (isAllowed) {
                 console.log(`[GameState] Setting current task to: ${taskId}`);
                this.state.currentTaskId = taskId;
                // Optionally reset map state related to the previous task if needed
                // this.state.mapState.selectedYear = null;
                // this.state.mapState.selectedNoiseType = null;
                return true; // Indicate success
            } else {
                console.warn(`[GameState] Cannot set task ${taskId} as current. It might be a future task whose prerequisite is not met.`);
                return false; // Indicate failure
            }
        } else {
            console.error(`[GameState] Attempted to set non-existent task ID: ${taskId}`);
            return false; // Indicate failure
        }
    }

    isTaskCompleted(taskId) {
        return this.state.completedTaskIds.has(taskId);
    }

    getNextTaskId(taskId) {
        const currentIndex = this.state.allTasks.findIndex(t => t.id === taskId);
        if (currentIndex !== -1 && currentIndex < this.state.allTasks.length - 1) {
            return this.state.allTasks[currentIndex + 1].id;
        }
        return null; // No next task
    }


    completeTask(taskId) {
        // const taskIndex = this.state.availableTasks.findIndex(t => t.id === taskId);
        // if (taskIndex !== -1) {
        //     const task = this.state.availableTasks[taskIndex];
        const task = this.getTaskById(taskId);
         if (task && !this.isTaskCompleted(taskId)) { // Check if task exists and is not already completed
            console.log(`[GameState] Completing task: ${taskId}`);
            this.state.completedTaskIds.add(taskId);
            // this.state.completedTasks.push(task); // Keep track via IDs is enough
            // this.state.availableTasks.splice(taskIndex, 1); // We keep all tasks now
            this.state.userData.points += task.points || 0;

            // Do not automatically set the next task as current here.
            // Return the ID of the next task so the UI can enable it.
            const nextTaskId = this.getNextTaskId(taskId);
            console.log(`[GameState] Task ${taskId} completed. Next task ID: ${nextTaskId}`);
            return { completed: true, nextTaskId: nextTaskId };
        }
        console.warn(`[GameState] Task ${taskId} could not be completed (already completed or not found).`);
        return { completed: false, nextTaskId: null };
    }

    // --- Chat History Methods ---

    getChatHistory(taskId) {
        return this.state.chatHistories[taskId] || [];
    }

    addChatMessage(taskId, sender, text) {
        if (this.state.chatHistories[taskId]) {
            this.state.chatHistories[taskId].push({ sender, text });
            console.log(`[GameState] Added chat message for task ${taskId}:`, { sender, text });
        } else {
            console.warn(`[GameState] Attempted to add chat message for non-existent task history: ${taskId}`);
        }
    }

    getCurrentTaskChatHistory() {
        return this.getChatHistory(this.state.currentTaskId);
    }

    addChatMessageToCurrentTask(sender, text) {
        if (this.state.currentTaskId) {
            this.addChatMessage(this.state.currentTaskId, sender, text);
        } else {
             console.warn("[GameState] Cannot add chat message: No current task set.");
        }
    }

}