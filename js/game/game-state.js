export class GameState {
    constructor() {
        this.state = {
            completedTasks: [],
            availableTasks: [],
            userData: {
                points: 0,
            },
            mapState: {
                selectedBorough: null,
                selectedYear: null, // Added selectedYear explicitly if needed elsewhere
                hoveredBoroughs: [], // Keep track of hovered boroughs
                clickedBoroughs: [], // Keep track of clicked boroughs
                activeTaskId: null // Keep track of the active task ID
            }
        };
    }
    
    initialize() {
        console.log("Initializing GameState."); 
        this.state.completedTasks = [];
        this.state.availableTasks = [];
        this.state.userData.points = 0;
        this.state.mapState = {
            selectedBorough: null,
            selectedYear: null,
            hoveredBoroughs: [],
            clickedBoroughs: [],
            activeTaskId: null
        };
    }
    
    updateState(partialState) {
        
        // Handle mapState update specifically to merge, not overwrite
        if (partialState.mapState) {
            this.state.mapState = { ...this.state.mapState, ...partialState.mapState };
            delete partialState.mapState; // Remove mapState from partialState to avoid overwriting later
        }
        // Handle userData update specifically
        if (partialState.userData) {
            this.state.userData = { ...this.state.userData, ...partialState.userData };
            delete partialState.userData;
        }

        // Merge remaining top-level properties
        this.state = { ...this.state, ...partialState };
    }
    
    completeTask(taskId) {
        const taskIndex = this.state.availableTasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            const task = this.state.availableTasks[taskIndex];
            
            this.state.completedTasks.push(task);
            this.state.availableTasks.splice(taskIndex, 1); 
            this.state.userData.points += task.points || 0;
    
            return true;
        }
        return false;
    }
    
}