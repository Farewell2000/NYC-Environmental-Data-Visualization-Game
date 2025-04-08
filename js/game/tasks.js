import { getTaskIntroDialogue } from './dialogues.js';

export const tasks = [
    {
        id: 'tree-density',
        level: 0,
        title: 'Tree Density Analysis',
        description: 'Use the year filter to explore tree data from 1995, 2005, and 2015. Which borough consistently appears to have the most trees? Click the borough on the map to submit your answer.',
        hint: 'Switch between the years using the dropdown. Observe the density of points in each borough. Queens often has a high number of street trees.',
        points: 25,
        completionCriteria: state => {
            // Check if the user clicked the designated 'correct' borough
            // For this game, let's assume Queens is the target answer.
            return state.mapState.selectedBorough === 'Queens';
        }
    },
    {
        id: 'tree-health-change',
        level: 0,
        title: 'Tree Health Over Time',
        description: 'Observe how the overall health of trees (indicated by color: Green=Good, Orange=Fair, Red=Poor) changes across the years (1995, 2005, 2015) in different boroughs. Which borough shows the most significant changes in tree health patterns? Click the borough to submit.',
        hint: 'Pay attention to shifts in the dominant colors within a borough as you change years. The Bronx has seen notable changes. Click on the borough you think changed most.',
        points: 35,
        completionCriteria: state => {
            // Check if the user clicked the designated 'correct' borough
            // For this game, let's assume The Bronx is the target answer for significant health changes.
            return state.mapState.selectedBorough === 'Bronx';
        }
    }
];

export class TaskManager {
    constructor(gameState, taskPanel, dialogueWindow) {
        this.gameState = gameState;
        this.taskPanel = taskPanel;
        this.dialogueWindow = dialogueWindow;
        this.tasks = tasks;
        this.currentTaskId = null;
    }
    
    initialize() {
        // Load tasks for current level (level 0)
        this.loadTasksForCurrentLevel();
        
        // Display first available task
        if (this.gameState.state.availableTasks.length > 0) {
            this.setActiveTask(this.gameState.state.availableTasks[0].id);
        }
        
        return this;
    }
    
    loadTasksForCurrentLevel() {
        const currentLevel = this.gameState.state.currentLevel ?? 0; // Use 0 if currentLevel is removed from state
        const levelTasks = this.tasks.filter(task => task.level === currentLevel);
        
        // Filter out already completed tasks
        const completedTaskIds = this.gameState.state.completedTasks.map(t => t.id);
        const availableTasks = levelTasks.filter(task => !completedTaskIds.includes(task.id));
        
        this.gameState.updateState({ availableTasks });
    }
    
    async setActiveTask(taskId) {
        const task = this.gameState.state.availableTasks.find(t => t.id === taskId);
        if (!task) {
            return;
        }
        
        this.currentTaskId = taskId;
        this.taskPanel.setTask(task);
        
        // Update game state
        this.gameState.updateState({ 
            mapState: { 
                ...this.gameState.state.mapState, 
                activeTaskId: taskId 
            }
        });
        
        // Show task introduction dialogue
        if (this.dialogueWindow) {
            const introDialogues = getTaskIntroDialogue(taskId);
            
            for (const dialogue of introDialogues) {
                await this.dialogueWindow.speak(dialogue.text, dialogue.duration);
            }
        }
    }
    
    async checkTaskCompletion() {
        if (!this.currentTaskId) return false;
        
        const state = this.gameState.state;
        const task = state.availableTasks.find(t => t.id === this.currentTaskId);
        
        if (task && task.completionCriteria(state)) {
            // Update progress to 100%
            this.taskPanel.updateProgress(100);
            
            // Complete the task
            this.gameState.completeTask(this.currentTaskId);
            
            // Show completion dialogue if available
            if (this.dialogueWindow) {
                const { dialogues } = await import('./dialogues.js');
                const completionDialogues = dialogues.taskComplete[this.currentTaskId];
                
                if (completionDialogues) {
                    for (const dialogue of completionDialogues) {
                        await this.dialogueWindow.speak(dialogue.text, dialogue.duration);
                    }
                }
            }
            
            // Set next task if available
            if (this.gameState.state.availableTasks.length > 0) {
                this.setActiveTask(this.gameState.state.availableTasks[0].id);
            } else {
                // Level completed
                this.dialogueWindow?.speak("Congratulations! You've completed all tasks for this level!", 3000);
            }
            
            return true;
        }
        
        return false;
    }
    
    updateProgress(progress) {
        if (!this.currentTaskId) return;
        this.taskPanel.updateProgress(progress);
    }
}