import { getTreeDialogue, getBoroughDialogue } from './dialogues.js'; // Import necessary dialogue functions

// Define completion keywords
const COMPLETION_KEYWORDS = {
    'tree-density': 'queens', // Assuming Queens is the target
    'tree-health-change': 'bronx', // Assuming Bronx is the target
    'noise-complaints': 'manhattan' // Assuming Manhattan is the target
};

// Export the list of all tasks
export const ALL_TASKS = [
    {
        id: 'tree-density',
        // level: 0, // Level might not be needed with linear progression
        title: 'Task 1: Tree Exploration (Density)',
        description: 'Explore tree data (1995, 2005, 2015) using the filter. Click on individual trees to see their details. When you think you know which borough has the most trees, type its name into the chat.',
        hint: 'Click trees to see their species and status. Use the year filter to observe patterns. Type the borough name in the chat when ready.',
        dataType: 'tree',
        initialYear: '2015',
        initialDialogue: "Let's explore the city's trees! Click on any tree point to learn about it. Use the filter to see data from different years. Which borough generally has the most trees? Type your answer in the chat below.",
        completionDialogue: "Correct! Queens generally has the highest number of street trees.",
        points: 25,
        checkCompletion: (gameState) => {
            const history = gameState.getCurrentTaskChatHistory();
            if (!history || history.length === 0) return false;
            const lastUserMessage = history.filter(m => m.sender === 'user').pop();
            return lastUserMessage && lastUserMessage.text.toLowerCase().includes(COMPLETION_KEYWORDS['tree-density']);
        },
        handleChat: (message, gameState) => {
            // Generic response for chat during this task
            return "Keep exploring the trees and the map! Let me know the borough when you've decided.";
        }
    },
    {
        id: 'tree-health-change',
        title: 'Task 2: Tree Exploration (Health Change)',
        description: 'Observe how tree health (Good, Fair, Poor) changes across years (1995, 2005, 2015) by clicking trees and using the filter. Which borough shows the most significant health pattern changes? Type its name into the chat.',
        hint: 'Click trees to see their status. Compare boroughs across years. Type the borough name in the chat.',
        dataType: 'tree',
        initialYear: '2015',
        initialDialogue: "Now focus on tree health. Click trees to see their status (Good, Fair, Poor). Which borough shows the biggest change in health over the years? Type your answer in the chat.",
        completionDialogue: "Good observation! The Bronx has experienced significant shifts in tree health patterns.",
        points: 35,
        checkCompletion: (gameState) => {
             const history = gameState.getCurrentTaskChatHistory();
            if (!history || history.length === 0) return false;
            const lastUserMessage = history.filter(m => m.sender === 'user').pop();
            return lastUserMessage && lastUserMessage.text.toLowerCase().includes(COMPLETION_KEYWORDS['tree-health-change']);
        },
        handleChat: (message, gameState) => {
             return "Compare the health status of trees across different years and boroughs. Type the borough name when you see a major shift.";
        }
    },
    {
        id: 'noise-complaints',
        title: 'Task 3: Noise Complaint Exploration',
        description: 'Visualize noise complaints using the choropleth map. Use the filter to switch complaint types. Click on boroughs to see a message. Which borough has the highest total complaints (use \'All Types\' filter)? Type its name into the chat.',
        hint: 'Make sure the filter is set to \'All Types\'. Click boroughs if you like. Type the name of the borough with the most complaints (darkest color) in the chat.',
        dataType: 'noise',
        initialNoiseType: 'All',
        initialDialogue: "Let's switch to noise complaints. The map shows complaint density. Click a borough for a message. Using \'All Types\' in the filter, which borough is the loudest overall? Type your answer in the chat.",
        completionDialogue: "That's right! Manhattan generally reports the highest number of noise complaints.",
        points: 40,
        checkCompletion: (gameState) => {
            const history = gameState.getCurrentTaskChatHistory();
            if (!history || history.length === 0) return false;
            const lastUserMessage = history.filter(m => m.sender === 'user').pop();
            // Also ensure 'All' types filter is active for this check
            const isAllTypesSelected = gameState.state.mapState.selectedNoiseType === 'All';
            return lastUserMessage && lastUserMessage.text.toLowerCase().includes(COMPLETION_KEYWORDS['noise-complaints']) && isAllTypesSelected;
        },
        handleChat: (message, gameState) => {
             return "Ensure the filter is set to \'All Types\'. Then, type the name of the borough with the most complaints.";
        }
    }
];
