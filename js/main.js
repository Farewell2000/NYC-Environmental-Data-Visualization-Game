import { MapComponent } from './components/map.js';
import { FilterPanel } from './components/filter-panel.js';
import { Legend } from './components/legend.js';
import { DialogueWindow } from './components/dialogue.js';
import { TaskPanel } from './components/task-panel.js';
import { Chatbot } from './components/chatbot.js';
import { GameState } from './game/game-state.js';
import { loadData } from './utils/data-loader.js';
import { ALL_TASKS } from './game/tasks.js';
import { getCharacterDialogue } from './utils/api-client.js';

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

        // Initialize map (no width/height needed for Leaflet)
        const map = new MapComponent('map');
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

        // Function to apply timed highlight to map
        const applyMapHighlight = () => {
            // const mapElement = document.getElementById('map');
            const mapContainerElement = document.querySelector('.map-container'); // Select container
            if (mapContainerElement) {
                console.log("[main] Applying map highlight to .map-container"); // DEBUG
                mapContainerElement.classList.add('map-highlight');
                // Remove the class after the animation finishes (1.2s * 2 iterations = 2.4s)
                setTimeout(() => {
                    mapContainerElement.classList.remove('map-highlight');
                }, 2400); // Adjusted timeout to match CSS animation duration (1.2s * 2)
            }
        };

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

            // 4. Display initial dialogue in Chatbot if it exists and history is empty
            if (task.initialDialogue && (!history || history.length === 0)) {
                // Add to display
                chatbot.addMessage('bot', task.initialDialogue);
                // Add to stored state
                gameState.addChatMessageToCurrentTask('bot', task.initialDialogue);
            }

            // 5. Update Map Visualization
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
             console.log(`[main] Task ${taskId} activated.`);
        }

        // Connect components
        console.log("Connecting components...");

        // --- Initial Highlighting --- START
        const taskPanelElement = document.getElementById('task-panel');
        const chatbotAreaElement = document.getElementById('chatbot-area');
        const chatInputElement = document.getElementById('chat-input');

        if (taskPanelElement && chatbotAreaElement && chatInputElement) {
            console.log("[main] Found elements for initial highlight:", { taskPanelElement, chatbotAreaElement }); // DEBUG
            taskPanelElement.classList.add('component-highlight');
            chatbotAreaElement.classList.add('component-highlight');

            const handleFirstInputFocus = () => {
                console.log("[main] First chat input focus detected.");
                taskPanelElement.classList.remove('component-highlight');
                chatbotAreaElement.classList.remove('component-highlight');
                applyMapHighlight(); // Apply the timed highlight to the map
                // Remove the listener after it runs once
                chatInputElement.removeEventListener('focus', handleFirstInputFocus);
            };

            chatInputElement.addEventListener('focus', handleFirstInputFocus);
        } else { // DEBUG
            console.error("[main] Could not find one or more elements for initial highlight:", { // DEBUG
                taskPanelExists: !!taskPanelElement, // DEBUG
                chatbotAreaExists: !!chatbotAreaElement, // DEBUG
                chatInputExists: !!chatInputElement // DEBUG
            }); // DEBUG
        }
        // --- Initial Highlighting --- END

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
        map.onBoroughClick((borough, data) => {
            const currentTaskId = gameState.getCurrentTaskId();
            const task = currentTaskId ? gameState.getTaskById(currentTaskId) : null;
            // Update state first (useful for potential future logic)
            gameState.updateState({ mapState: { selectedBorough: borough } });

            // If the current task is the noise task, show borough dialogue
            if (task && task.dataType === 'noise') {
                // Moved dialogue logic directly here
                const boroughDialogueText = `You've selected ${borough}. Check the noise complaint data. What patterns do you observe?`;
                dialogue.speak(boroughDialogueText);
            }
            // Removed old completion checking logic
        });

        // Add tree click handler
        map.onTreeClick(async treeData => {
            const currentTaskId = gameState.getCurrentTaskId();
            const task = currentTaskId ? gameState.getTaskById(currentTaskId) : null;
            // Displaying tree info might be better suited for a tooltip or a dedicated panel
            console.log("Tree clicked:", treeData); // Keep log for debugging

            // Show tree dialogue if it's a tree task using the /character endpoint
            if (task && task.dataType === 'tree') {
                try {
                    // Prepare data for the /character endpoint
                    const requestData = {
                        //taskId: currentTaskId, // Backend seems to infer task based on properties?
                        treeProperties: {
                            status: treeData.status,
                            spc_common: treeData.spc_common,
                            latitude: treeData.latitude,
                            longitude: treeData.longitude,
                        }
                    };
                    console.log("[main] Sending to /character via api-client:", requestData);
                    // Use the api-client
                    const result = await getCharacterDialogue(currentTaskId, requestData.treeProperties);
                    console.log("[main] /character response:", result);

                    if (result && result.message) {
                        dialogue.speak(result.message);
                    } else {
                        console.warn("[main] Received empty or invalid response from /character.");
                        dialogue.speak("Hmm, I don't have specific info for this tree right now.");
                    }
                } catch (error) {
                    console.error("[main] Error calling /character endpoint:", error);
                    dialogue.speak("Sorry, I couldn't fetch the details for this tree.");
                }
            }
        });

        // Filter panel interactions
        filterPanel.onFilterChange((filterSetName, field, value) => {
            console.log(`[main] Filter changed: Set='${filterSetName}', Field='${field}', Value='${value}'`);
            const currentTask = gameState.getTaskById(gameState.getCurrentTaskId());

            if (currentTask && filterSetName === 'tree' && field === 'year') {
                const year = value;
                const currentTreeData = treeDataByYear[year] || [];
                gameState.updateState({ mapState: { selectedYear: year } });
                map.setData('tree', currentTreeData); // Update map data
                // map.setFilteredData(currentTreeData); // Update map visualization
            } else if (currentTask && filterSetName === 'noise' && field === 'noiseType') {
                const noiseType = value;
                gameState.updateState({ mapState: { selectedNoiseType: noiseType } });
                // The map component handles filtering noise data internally for choropleth based on type
                // We just need to trigger an update
                map.updateNoiseChoropleth(noiseType);
            }
        });

        // Chatbot interactions
        chatbot.registerTaskCompleteListener((completedTaskId, nextTaskId) => {
            console.log(`[main] Task completion event received for task ${completedTaskId}. Next task: ${nextTaskId}`);
            taskPanel.updateTaskCard(completedTaskId); // Mark the completed task card
            if (nextTaskId) {
                taskPanel.updateTaskCard(nextTaskId); // Make the next task card selectable
            }
            // Focus back on chat input for follow-up conversation
            chatbot.inputElement.focus();
        });

        // Final setup
        console.log("Initializing first task...");
        // Activate the initial task (first one in the list)
        const initialTaskId = gameState.getCurrentTaskId();
        if (initialTaskId) {
            activateTask(initialTaskId);
        } else {
            console.error("[main] No initial task found!");
        }

        // Initial rendering of the task panel after gameState is initialized
        taskPanel.renderTasks(); // Ensure panel shows initial state correctly

        console.log("Application setup complete.");

    } catch (error) {
        console.error("Error during application initialization:", error);
        // Display a user-friendly error message on the page
        document.body.innerHTML = `<div style="color: red; padding: 20px;">Failed to initialize the application: ${error.message}. Please check the console for details.</div>`;
    }
});