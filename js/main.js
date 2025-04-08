import { MapComponent } from './components/map.js';
import { FilterPanel } from './components/filter-panel.js';
import { Legend } from './components/legend.js';
import { DialogueWindow } from './components/dialogue.js';
import { TaskPanel } from './components/task-panel.js';
import { Chatbot } from './components/chatbot.js';
import { GameState } from './game/game-state.js';
import { TaskManager } from './game/tasks.js';
import { loadData } from './utils/data-loader.js';
import { dialogues } from './game/dialogues.js';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Load data
        console.log("Loading data...");
        const boroughGeoJson = await loadData('data/new-york-city-boroughs.json');
        const treeData1995 = await loadData('data/tree/1995_Street_Tree.csv');
        const treeData2005 = await loadData('data/tree/2005_Street_Tree.csv');
        const treeData2015 = await loadData('data/tree/2015_Street_Tree.csv');
        
        // Store tree data by year
        const treeDataByYear = {
            '1995': treeData1995,
            '2005': treeData2005,
            '2015': treeData2015
        };

        if (!boroughGeoJson || !treeData1995 || !treeData2005 || !treeData2015) {
            throw new Error("Failed to load required map or tree data");
        }
        
        console.log("Data loaded successfully");
        
        // Basic borough data 
        const boroughData = {
            "Bronx": {color: "#b3e2cd" },
            "Brooklyn": {color: "#fddaec" },
            "Manhattan": {color: "#cbd5e8" },
            "Queens": {color: "#f4cae4" },
            "Staten Island": {color: "#e6f5c9" }
        };
        
        // Initialize game state
        const gameState = new GameState();
        gameState.initialize();
        
        // Initialize components
        console.log("Initializing components...");
        
        // Initialize map
        const map = new MapComponent('map', 800, 600);
        map.initialize();
        
        // Initialize filter panel
        const filterPanel = new FilterPanel('filter-panel');
        filterPanel.initialize();

        // Remove population filter (comment block removed)

        // Add year selection filter
        filterPanel.addFilter({
            type: 'dropdown',
            field: 'year',
            label: 'Select Tree Data Year:',
            options: [
                { value: '1995', label: '1995' },
                { value: '2005', label: '2005' },
                { value: '2015', label: '2015' },
            ],
            defaultValue: '2015', // Start with 2015 data
            operator: '='
        });
        
        // Initialize legend
        const legend = new Legend('legend');
        const boroughLegendItems = Object.keys(boroughData).map(name => ({
            label: name,
            color: boroughData[name].color
        }));
        const healthLegendItems = [
            { label: 'Good', color: '#4CAF50' }, // Green from map.js
            { label: 'Fair', color: '#FF9800' }, // Orange from map.js
            { label: 'Poor', color: '#F44336' }  // Red from map.js
        ];
        // Initialize with separate sections
        legend.initialize({
            'Boroughs': boroughLegendItems,
            'Tree Health': healthLegendItems
        });
        
        // Initialize dialogue window
        const dialogue = new DialogueWindow('dialogue-window', 'game-avatar', 'dialogue-text');
        
        // Initialize task panel
        const taskPanel = new TaskPanel('task-panel', 'task-description', 'task-progress');
        
        // Initialize chat
        const chatbot = new Chatbot('chat-history', 'chat-input', 'chat-submit');
        
        // Initialize task manager with dialogue window
        const taskManager = new TaskManager(gameState, taskPanel, dialogue);
        
        // Connect components to game state
        console.log("Connecting components...");
        
        // Map interactions update game state
        map.onBoroughHover((borough, data) => {
            // Track which boroughs have been hovered
            const hoveredBoroughs = gameState.state.mapState.hoveredBoroughs || [];
            if (!hoveredBoroughs.includes(borough)) {
                gameState.updateState({
                    mapState: {
                        ...gameState.state.mapState,
                        hoveredBoroughs: [...hoveredBoroughs, borough]
                    }
                });
                
                // Check for task completion
                taskManager.checkTaskCompletion();
            }
        });
        
        map.onBoroughClick((borough, data) => {
            // Track borough clicks
            const clickedBoroughs = gameState.state.mapState.clickedBoroughs || [];
            
            gameState.updateState({
                mapState: {
                    ...gameState.state.mapState,
                    selectedBorough: borough,
                    clickedBoroughs: clickedBoroughs.includes(borough) ? 
                        clickedBoroughs : [...clickedBoroughs, borough]
                }
            });
            
            // Check for task completion
            taskManager.checkTaskCompletion();
        });
        
        // Filter panel updates game state
        filterPanel.onFilterChange(filters => {
            // Find the year filter
            const yearFilter = filters.find(f => f.field === 'year');
            const selectedYear = yearFilter ? yearFilter.value : '2015'; // Default to 2015 if not found

            // Update game state with selected year (removed general filters)
            gameState.updateState({
                mapState: {
                    //...gameState.state.mapState, // Spread operator handled in GameState.updateState now
                    // filters: filters, // Removed filters
                    selectedYear: selectedYear // Store selected year
                }
            });
            
            // Get the tree data for the selected year
            const currentTreeData = treeDataByYear[selectedYear];

            // Update the map with the new dataset
            if (currentTreeData) {
                map.setAdditionalData(currentTreeData); // Pass the full dataset for the year
            } else {
                console.warn(`Tree data for year ${selectedYear} not found.`);
                map.setAdditionalData([]); // Clear points if data is missing
            }
            
            // The map.applyFilter method is no longer needed here as we are replacing the whole dataset
            // map.applyFilter(item => { ... });
            
            // Check for task completion
            taskManager.checkTaskCompletion();
        });
        
        // Chat interactions update game state
        chatbot.onMessage(message => {
            // Track chat history
            const chatHistory = gameState.state.chatHistory || [];
            gameState.updateState({
                chatHistory: [...chatHistory, { sender: 'user', text: message }]
            });
            
            // Process the message and return a response
            let response = "I'm not sure how to help with that. Try asking about NYC data or boroughs.";
            
            const messageLower = message.toLowerCase();
            
            // Check for keywords in the message
            if (messageLower.includes('help')) {
                response = dialogues.chatResponses.help;
            } else if (messageLower.includes('population') || messageLower.includes('people')) {
                response = dialogues.chatResponses.population;
            } else if (messageLower.includes('borough')) {
                response = dialogues.chatResponses.boroughs;
            } else if (messageLower.includes('subway') || messageLower.includes('transport')) {
                response = dialogues.chatResponses.transportation;
            } else if (messageLower.includes('landmark') || messageLower.includes('famous')) {
                response = dialogues.chatResponses.landmarks;
            } else if (messageLower.includes('density')) {
                response = "Manhattan has the highest population density at over 70,000 people per square mile. Staten Island has the lowest at about 8,000 people per square mile.";
            }
            
            // Update chat history with bot response
            gameState.updateState({
                chatHistory: [...gameState.state.chatHistory, { sender: 'bot', text: response }]
            });
            
            // Check for task completion
            taskManager.checkTaskCompletion();
            
            return response;
        });
        
        // Set up map with initial data (2015)
        console.log("Setting up map data...");
        map.setBoroughData(boroughData)
           .setAdditionalData(treeDataByYear['2015']) // Use the 2015 dataset initially
           .loadGeoJson(boroughGeoJson);
        
        // Initialize game
        console.log("Starting game...");
        taskManager.initialize();
        
        // Start introduction sequence
        for (const intro of dialogues.intro) {
            await dialogue.speak(intro.text, intro.duration);
        }
        
    } catch (error) {
        console.error("Error initializing game:", error);
        document.body.innerHTML = `
            <div style="padding: 20px; color: red; text-align: center;">
                <h2>Error Loading Game</h2>
                <p>${error.message}</p>
                <p>Please check the console for more details.</p>
            </div>
        `;
    }
});