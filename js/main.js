import { MapComponent } from './components/map.js';
import { FilterPanel } from './components/filter-panel.js';
import { Legend } from './components/legend.js';
import { DialogueWindow } from './components/dialogue.js';
import { TaskPanel } from './components/task-panel.js';
import { Chatbot } from './components/chatbot.js';
import { GameState } from './game/game-state.js';
import { loadData } from './utils/data-loader.js';
import { getTreeDialogue, getBoroughDialogue } from './game/dialogues.js';
import { ALL_TASKS } from './game/tasks.js';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Load data concurrently
        console.log("Loading data...");
        const [boroughGeoJson, treeData1995, treeData2005, treeData2015, noiseData] = await Promise.all([
            loadData('data/new-york-city-boroughs.json'),
            loadData('data/tree/1995_Street_Tree.csv'),
            loadData('data/tree/2005_Street_Tree.csv'),
            loadData('data/tree/2015_Street_Tree.csv'),
            loadData('data/noise/Noise_Complaints.csv')
        ]);

        // Store tree data by year
        const treeDataByYear = {
            '1995': treeData1995,
            '2005': treeData2005,
            '2015': treeData2015
        };

        if (!boroughGeoJson || !treeData1995 || !treeData2005 || !treeData2015 || !noiseData) {
            // Check if any loaded data is null or undefined
            throw new Error("Failed to load one or more required data files");
        }

        console.log("Data loaded successfully");

        // Basic borough data 
        const boroughData = {
            "Bronx": { color: "#b3e2cd" },
            "Brooklyn": { color: "#fddaec" },
            "Manhattan": { color: "#cbd5e8" },
            "Queens": { color: "#f4cae4" },
            "Staten Island": { color: "#e6f5c9" }
        };

        // Initialize game state with all defined tasks
        const gameState = new GameState();
        gameState.initialize(ALL_TASKS);

        // Initialize components
        console.log("Initializing components...");

        // Initialize map
        const map = new MapComponent('map', 1280, 720);
        map.initialize();

        // Initialize filter panel
        const filterPanel = new FilterPanel('filter-panel');
        filterPanel.initialize();

        // Define filter sets
        // Tree Filter Set
        filterPanel.addFilterDefinition('tree', {
            type: 'dropdown',
            field: 'year',
            label: 'Select Tree Data Year:',
            options: [
                { value: '1995', label: '1995' },
                { value: '2005', label: '2005' },
                { value: '2015', label: '2015' },
            ],
            defaultValue: '2015',
            operator: '='
        });

        // Noise Filter Set - Extract unique noise types from data
        const noiseTypes = [...new Set(noiseData.map(item => item['Complaint Type']))].filter(Boolean);
        filterPanel.addFilterDefinition('noise', {
            type: 'dropdown',
            field: 'noiseType',
            label: 'Select Noise Complaint Type:',
            options: [
                { value: 'All', label: 'All Types' }, // Add an option for all types
                ...noiseTypes.map(type => ({ value: type, label: type }))
            ],
            defaultValue: 'All',
            operator: '='
        });

        // Initialize legend
        const legend = new Legend('legend');

        // Define legend data structures
        const boroughLegendItems = Object.keys(boroughData).map(name => ({
            label: name,
            color: boroughData[name].color
        }));
        const treeHealthLegend = {
            'Boroughs': boroughLegendItems,
            'Tree Health': [
                { label: 'Good', color: '#4CAF50' },
                { label: 'Fair', color: '#FF9800' },
                { label: 'Poor', color: '#F44336' }
            ]
        };
        const noiseLegend = {
            'Boroughs': boroughLegendItems,
            'Noise Level': [
                // Placeholder: Legend will be dynamically generated based on scale in map.js
                // Or we can define static bins here
                { label: 'Low', color: '#ffffcc' }, // Example colors from YlOrRd
                { label: 'Medium', color: '#fd8d3c' },
                { label: 'High', color: '#bd0026' }
            ]
        };

        // Initialize dialogue window
        const dialogue = new DialogueWindow('dialogue-window', 'game-avatar', 'dialogue-text');

        // Initialize task panel
        const taskPanel = new TaskPanel('task-panel', gameState);

        // Initialize chat
        const chatbot = new Chatbot('chat-history', 'chat-input', 'chat-submit', gameState);

        // Function to activate a task
        async function activateTask(taskId) {
            console.log(`[main] Activating task: ${taskId}`);
            const task = gameState.getTaskById(taskId);
            if (!task) {
                console.error(`[main] Task ${taskId} not found!`);
                return;
            }

            // 1. Set current task in GameState (if not already set)
            const success = gameState.setCurrentTask(taskId);
            if (!success) {
                 console.warn(`[main] Failed to set task ${taskId} as current. Aborting activation.`);
                 // Maybe refresh task panel to show correct state?
                 taskPanel.refresh();
                 return;
            }

            // 2. Update Task Panel UI (highlighting)
            taskPanel.refresh(); // Re-render to reflect new current task

            // 3. Load Chat History
            const history = gameState.getChatHistory(taskId);
            chatbot.loadHistory(history);

            // 4. Update Map Visualization
            map.clearAllLayers(); // Clear previous task's layers
            map.setBoroughData(boroughData) // Always show boroughs
               .loadGeoJson(boroughGeoJson);

            if (task.dataType === 'tree') {
                const year = gameState.state.mapState.selectedYear || task.initialYear || '2015'; // Use state or default
                const currentTreeData = treeDataByYear[year] || [];
                map.setData('tree', currentTreeData); // Ensure data is available in map component
                map.setActiveDataset('tree'); // Set active type, triggers updateTreePoints
                filterPanel.setActiveFilterSet('tree'); // Show correct filters (using setActiveFilterSet)
                legend.update(treeHealthLegend); // Show correct legend
                gameState.updateState({ mapState: { selectedYear: year }}); // Ensure state consistency
            } else if (task.dataType === 'noise') {
                const noiseType = gameState.state.mapState.selectedNoiseType || task.initialNoiseType || 'All';
                // Map component aggregates internally, just ensure full data is set
                map.setData('noise', noiseData); // Map needs the full data for choropleth calculation
                map.setActiveDataset('noise'); // Set active type, triggers updateNoiseChoropleth
                filterPanel.setActiveFilterSet('noise'); // Show correct filters (using setActiveFilterSet)
                legend.update(noiseLegend);
                gameState.updateState({ mapState: { selectedNoiseType: noiseType }});
            }

            // 5. Display initial dialogue for the task (if any)
            if (task.initialDialogue) {
                await dialogue.speak(task.initialDialogue);
            }
             console.log(`[main] Task ${taskId} activated.`);
        }

        // Function to handle task completion
        async function handleTaskCompletion(taskId) {
            console.log(`[main] Checking completion for task: ${taskId}`);
            const task = gameState.getTaskById(taskId);
            if (!task || gameState.isTaskCompleted(taskId)) {
                console.log(`[main] Task ${taskId} not found or already completed.`);
                return; // Already completed or doesn't exist
            }

            // Check completion condition (now based on gameState, possibly chat history)
            const isComplete = task.checkCompletion(gameState); // Removed map/filterPanel args
            if (isComplete) {
                console.log(`[main] Task ${taskId} condition met! Completing...`);
                const { completed, nextTaskId } = gameState.completeTask(taskId);

                if (completed) {
                     await dialogue.speak(task.completionDialogue || "Task Complete!");

                    // Update the completed task card visually
                    taskPanel.updateTaskCard(taskId);

                    // Update (unlock) the next task card visually, if there is one
                    if (nextTaskId) {
                        console.log(`[main] Unlocking next task card: ${nextTaskId}`);
                        taskPanel.updateTaskCard(nextTaskId);
                    }
                    // No automatic activation of the next task
                }
            } else {
                console.log(`[main] Task ${taskId} condition not met.`);
            }
        }

        // Connect components
        console.log("Connecting components...");

        // When a task is selected in the panel, activate it
        taskPanel.onTaskSelect(taskId => {
            console.log(`[main] Task selection event received for task: ${taskId}`);
            if (taskId !== gameState.getCurrentTaskId()) {
                activateTask(taskId);
            } else {
                console.log(`[main] Task ${taskId} is already the current task.`);
            }
        });

        // Map interactions: Display info/dialogue, DO NOT trigger completion
        map.onBoroughHover((borough, data) => {
            // Can add hover effects or info display if needed
        });

        map.onBoroughClick((borough, data) => {
            const currentTaskId = gameState.getCurrentTaskId();
            const task = currentTaskId ? gameState.getTaskById(currentTaskId) : null;
            // Update state first (useful for potential future logic)
            gameState.updateState({ mapState: { selectedBorough: borough } });

            // If the current task is the noise task, show borough dialogue
            if (task && task.dataType === 'noise') {
                const boroughDialogue = getBoroughDialogue(borough);
                dialogue.speak(boroughDialogue);
            }
            // Removed handleTaskCompletion call from here
        });

        // Add tree click handler
        map.onTreeClick(treeData => {
            const currentTaskId = gameState.getCurrentTaskId();
            const task = currentTaskId ? gameState.getTaskById(currentTaskId) : null;

             // Only show tree dialogue if the current task is a tree task
             if (task && task.dataType === 'tree') {
                console.log("[main] Tree clicked during tree task, showing dialogue:", treeData);
                const treeDialogue = getTreeDialogue(treeData);
                dialogue.speak(treeDialogue);
             }
        });

        // Filter panel changes need to update map
        filterPanel.onFilterChange(filters => {
            const currentTaskId = gameState.getCurrentTaskId();
            const task = currentTaskId ? gameState.getTaskById(currentTaskId) : null;

            if (task) {
                if (task.dataType === 'tree' && filters.some(f => f.field === 'year')) {
                    const yearFilter = filters.find(f => f.field === 'year');
                    const year = yearFilter ? yearFilter.value : (gameState.state.mapState.selectedYear || '2015');
                    console.log(`[main] Year filter changed to: ${year}`);
                    gameState.updateState({ mapState: { selectedYear: year } }); // Update game state
                    const newTreeData = treeDataByYear[year] || [];
                    map.setData('tree', newTreeData); // Update map data
                    map.setActiveDataset('tree'); // Re-render tree points

                } else if (task.dataType === 'noise' && filters.some(f => f.field === 'noiseType')) {
                    const noiseFilter = filters.find(f => f.field === 'noiseType');
                    const noiseType = noiseFilter ? noiseFilter.value : (gameState.state.mapState.selectedNoiseType || 'All');
                    console.log(`[main] Noise type filter changed to: ${noiseType}`);
                    gameState.updateState({ mapState: { selectedNoiseType: noiseType } }); // Update game state
                    
                    // Filter the noise data *before* sending it to the map for choropleth
                    let filteredNoiseData = noiseData;
                    if (noiseType !== 'All') {
                        filteredNoiseData = noiseData.filter(item => item['Complaint Type'] === noiseType);
                    }
                    map.setData('noise', filteredNoiseData); // Update map data
                    map.setActiveDataset('noise'); // Re-render choropleth
                    
                    // Check completion *only* if noise type is 'All', relevant for the task
                    if (noiseType === 'All') {
                        // Maybe trigger check completion here IF the task requires 'All'? 
                        // handleTaskCompletion(currentTaskId); // Decided against this, completion via chat.
                    }
                }
            }
        });

        // Chat interactions: Handle responses and check completion
        chatbot.onMessage(userMessage => {
            const currentTaskId = gameState.getCurrentTaskId();
            const task = currentTaskId ? gameState.getTaskById(currentTaskId) : null;

            let botResponse = "Hmm, I'm not sure how to respond to that."; // Default response

            if (task && task.handleChat) {
                 // Get task-specific response (or default if handleChat returns nothing useful)
                 const taskResponse = task.handleChat(userMessage, gameState);
                 if (taskResponse) {
                     botResponse = taskResponse;
                 }
            }

            // Send the bot response
            chatbot.respondToUser(botResponse);

            // ALWAYS check for completion after a user message is sent and processed
            if (currentTaskId) {
                 handleTaskCompletion(currentTaskId);
            }
        });

        // Initial setup
        console.log("Performing initial setup...");
        dialogue.setAvatar('assets/avatars/cartoon-avatar.png');
        taskPanel.renderTasks(); // Initial render
        const firstTaskId = gameState.getCurrentTaskId();
        if (firstTaskId) {
            console.log(`Activating first task: ${firstTaskId}`);
            activateTask(firstTaskId);
        } else {
            console.warn("No initial task found!");
        }

        // Introduce the game
        /* await dialogue.speak(dialogues.introduction); */ // This line is removed as dialogues.introduction no longer exists
        
        console.log("Application initialized.");

    } catch (error) {
        console.error("Initialization failed:", error);
        // Display a user-friendly error message on the page
        document.body.innerHTML = `<div style="color: red; padding: 20px;">Error initializing application: ${error.message}. Please check the console for details.</div>`;
    }
});