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

        // Basic borough data with very light pastel colors
        const boroughData = {
            "Bronx": { color: "#E6DBFA" },      // Ultra Light Lavender
            "Brooklyn": { color: "#FFE8EC" },   // Ultra Light Pink
            "Manhattan": { color: "#D2F9F4" },  // Ultra Light Cyan
            "Queens": { color: "#FFF5D1" },     // Ultra Light Gold
            "Staten Island": { color: "#E7FCF0" } // Ultra Light Mint
        };

        // Initialize game state with all defined tasks
        const gameState = new GameState();
        gameState.initialize(ALL_TASKS);

        // Initialize components

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

        // Tree Status Filter (Add this definition)
        filterPanel.addFilterDefinition('tree', {
            type: 'checkbox-group',
            field: 'status',
            label: 'Tree Health Status:',
            options: [
                { value: 'Good', label: 'Good' },
                { value: 'Fair', label: 'Fair' },
                { value: 'Poor', label: 'Poor' }
            ],
            defaultValue: ['Good', 'Fair', 'Poor'], // Default to all checked
            operator: 'in' // Use 'in' operator for array matching
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
        // Define noise legend as a gradient (will be handled by legend.js)
        const noiseLegendGradient = {
            'Noise Level (Complaints)': {
                type: 'gradient',
                minLabel: 'Low',
                maxLabel: 'High',
                // Colors from light red/pink to dark red
                colors: ['#FFEBEE', '#FFCDD2', '#EF9A9A', '#E57373', '#EF5350', '#F44336', '#E53935', '#D32F2F', '#C62828', '#B71C1C']
            }
        };

        // Initialize dialogue window
        const dialogue = new DialogueWindow('dialogue-window', 'game-avatar', 'dialogue-text');

        // Initialize task panel
        const taskPanel = new TaskPanel('task-panel', gameState);

        // Initialize chat
        const chatbot = new Chatbot('chat-history', 'chat-input', 'chat-submit', gameState);

        // Function to apply timed highlight to map
        const applyMapHighlight = () => {
            const mapContainerElement = document.querySelector('.map-container'); // Select container
            if (mapContainerElement) {
                mapContainerElement.classList.add('map-highlight');
                // Remove the class after the animation finishes (1.2s * 2 iterations = 2.4s)
                setTimeout(() => {
                    mapContainerElement.classList.remove('map-highlight');
                }, 2400); // Adjusted timeout to match CSS animation duration (1.2s * 2)
            }
        };

        // Function to activate a task
        async function activateTask(taskId) {
            const task = gameState.getTaskById(taskId);
            if (!task) {
                console.error(`[main] Task ${taskId} not found!`);
                return;
            }

            // 1. Set current task in GameState (if not already set)
            const success = gameState.setCurrentTask(taskId);
            if (!success) {
                 taskPanel.refresh();
                 return;
            }

            // 2. Update Task Panel UI (highlighting)
            taskPanel.refresh(); // Re-render to reflect new current task

            // 3 & 4. Load Chat History and Display Initial Instructions/Message
            const history = gameState.getChatHistory(taskId);
            
            let initialText = task.instructions; // Prioritize instructions
            if (!initialText && task.initialDialogue) { // Use initialDialogue as fallback
                initialText = task.initialDialogue;
            }
            // Pass the determined initial text (instructions or fallback) to loadHistory
            chatbot.loadHistory(history, initialText);

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
                // Pass the new gradient legend structure for noise tasks
                legend.update(noiseLegendGradient);
                gameState.updateState({ mapState: { selectedNoiseType: noiseType }});
            }
        }

        // Connect components

        // --- Initial Highlighting --- START
        const taskPanelElement = document.getElementById('task-panel');
        const chatbotAreaElement = document.getElementById('chatbot-area');
        const chatInputElement = document.getElementById('chat-input');

        if (taskPanelElement && chatbotAreaElement && chatInputElement) {
            taskPanelElement.classList.add('component-highlight');
            chatbotAreaElement.classList.add('component-highlight');

            const handleFirstInputFocus = () => {
                taskPanelElement.classList.remove('component-highlight');
                chatbotAreaElement.classList.remove('component-highlight');
                applyMapHighlight(); // Apply the timed highlight to the map
                // Remove the listener after it runs once
                chatInputElement.removeEventListener('focus', handleFirstInputFocus);
            };

            chatInputElement.addEventListener('focus', handleFirstInputFocus);
        } else { // DEBUG
            console.error("[main] Could not find one or more elements for initial highlight:", {
                taskPanelExists: !!taskPanelElement,
                chatbotAreaExists: !!chatbotAreaElement,
                chatInputExists: !!chatInputElement
            });
        }
        // --- Initial Highlighting --- END

        // When a task is selected in the panel, activate it
        taskPanel.onTaskSelect(taskId => {
            if (taskId !== gameState.getCurrentTaskId()) {
                activateTask(taskId);
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
        filterPanel.onFilterChange((filterSetName, currentFilters) => {
            const currentTask = gameState.getTaskById(gameState.getCurrentTaskId());

            if (currentTask && filterSetName === 'tree') {
                // Get current filter values from the received object
                const year = currentFilters.year;
                const statuses = currentFilters.status || []; // Ensure status is an array

                // Update game state (optional, but good for tracking)
                gameState.updateState({ mapState: { selectedYear: year, selectedStatuses: statuses } });

                // Get the base data for the selected year
                const baseTreeData = treeDataByYear[year] || [];

                // Filter the base data by selected statuses
                const filteredTreeData = baseTreeData.filter(tree => {
                    return statuses.includes(tree.status);
                });

                console.log(`[main] Applying tree filters: Year=${year}, Statuses=${statuses.join(',') || 'None'}. Count: ${filteredTreeData.length}`);

                map.setFilteredData(filteredTreeData); // Pass the pre-filtered data to the map
                // No need to call map.setData or map.setActiveDataset again if data type hasn't changed

            } else if (currentTask && filterSetName === 'noise') {
                const noiseType = currentFilters.noiseType;
                gameState.updateState({ mapState: { selectedNoiseType: noiseType } });
                // Noise map update is handled internally by map.js based on type
                map.updateNoiseChoropleth(noiseType);
            }
        });

        // Chatbot interactions
        chatbot.registerTaskCompleteListener((completedTaskId, nextTaskId) => {
            taskPanel.updateTaskCard(completedTaskId); // Mark the completed task card
            if (nextTaskId) {
                taskPanel.updateTaskCard(nextTaskId); // Make the next task card selectable
            }
            // Focus back on chat input for follow-up conversation
            chatbot.inputElement.focus();
        });

        // Final setup
        const initialTaskId = gameState.getCurrentTaskId();
        if (initialTaskId) {
            activateTask(initialTaskId);
        } else {
            console.error("[main] No initial task found!");
        }

        // Initial rendering of the task panel after gameState is initialized
        taskPanel.renderTasks(); // Ensure panel shows initial state correctly

    } catch (error) {
        console.error("Error during application initialization:", error);
        // Display a user-friendly error message on the page
        document.body.innerHTML = `<div style="color: red; padding: 20px;">Failed to initialize the application: ${error.message}. Please check the console for details.</div>`;
    }
});