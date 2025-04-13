// import { getBoroughDialogue } from './dialogues.js'; // Import necessary dialogue functions

// Export the list of all tasks
export const ALL_TASKS = [
    {
        id: 'tree-density',
        title: 'Task 1: Tree Exploration (Density)',
        description: 'Explore tree data (1995, 2005, 2015) using the filter. Click on individual trees to see their details. When you think you know which borough has the most trees, type its name into the chat.',
        hint: 'Click trees to see their species and status. Use the year filter to observe patterns. Type the borough name in the chat when ready.',
        dataType: 'tree',
        initialYear: '2015',
        initialDialogue: "Let's explore the city's trees! Click on any tree point to learn about it. Use the filter to see data from different years. Which borough generally has the most trees? Type your answer in the chat below.",
        points: 25,
        question: "Based on the data across the years, which borough generally has the most street trees?",
        correctAnswer: "Queens generally has the highest number of street trees."
    },
    {
        id: 'tree-health-change',
        title: 'Task 2: Tree Exploration (Health Change)',
        description: 'Observe how tree health (Good, Fair, Poor) changes across years (1995, 2005, 2015) by clicking trees and using the filter. Which borough shows the most significant health pattern changes? Type its name into the chat.',
        hint: 'Click trees to see their status. Compare boroughs across years. Type the borough name in the chat.',
        dataType: 'tree',
        initialYear: '2015',
        initialDialogue: "Now focus on tree health. Click trees to see their status (Good, Fair, Poor). Which borough shows the biggest change in health over the years? Type your answer in the chat.",
        points: 35,
        question: "Considering the changes in tree health categories (Good, Fair, Poor) between the available years, which borough shows the most significant pattern shift?",
        correctAnswer: "The Bronx has experienced significant shifts in tree health patterns over the years."
    },
    {
        id: 'noise-complaints',
        title: 'Task 3: Noise Complaint Exploration',
        description: 'Visualize noise complaints using the choropleth map. Use the filter to switch complaint types. Click on boroughs to see a message. Which borough has the highest total complaints (use \'All Types\' filter)? Type its name into the chat.',
        hint: 'Make sure the filter is set to \'All Types\'. Click boroughs if you like. Type the name of the borough with the most complaints (darkest color) in the chat.',
        dataType: 'noise',
        initialNoiseType: 'All',
        initialDialogue: "Let's switch to noise complaints. The map shows complaint density. Click a borough for a message. Using \'All Types\' in the filter, which borough is the loudest overall? Type your answer in the chat.",
        points: 40,
        question: "When looking at 'All Types' of noise complaints, which borough consistently shows the highest density?",
        correctAnswer: "Manhattan generally reports the highest number of noise complaints overall."
    }
];
