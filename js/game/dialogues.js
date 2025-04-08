export const dialogues = {
    // Introduction sequence
    intro: [
        {
            text: "Welcome to the NYC Tree Explorer! I'm Meow, your guide.",
            duration: 3000
        },
        {
            text: "We'll analyze street tree data across different years (1995, 2005, 2015).",
            duration: 4000
        },
        {
            text: "Your first task involves figuring out which borough generally has the most trees. Use the year filter to investigate.",
            duration: 5000
        }
    ],
    
    // Task completion messages
    taskComplete: {
        'tree-density': [
            {
                text: "That's correct! Queens often boasts the highest number of street trees.",
                duration: 3500
            },
            {
                text: "Next, let's look at how tree health has changed over the years.",
                duration: 3000
            }
        ],
        'tree-health-change': [
            {
                text: "Good observation! The Bronx has indeed shown significant shifts in tree health patterns over this period.",
                duration: 4500
            },
            {
                text: "You've completed the tree analysis tasks. Great job exploring the data!",
                duration: 4000
            }
        ]
    },
    
    // Help messages
    help: {
        map: "Hover over any borough to see its population. Click on a borough to select it and see more details.",
        filter: "Use the filters on the left to narrow down the data. Try adjusting the population slider to see which boroughs match.",
        chat: "You can ask me questions about New York City data or how to complete tasks. Try asking 'Which borough has the highest population?'"
    },
    
    // Chat responses
    chatResponses: {
        population: "Brooklyn has the highest population with over 2.7 million residents, followed by Queens with 2.4 million.",
        boroughs: "New York City has five boroughs: Manhattan, Brooklyn, Queens, The Bronx, and Staten Island.",
        transportation: "The subway system serves all boroughs except Staten Island, which is connected by the Staten Island Ferry.",
        landmarks: "Famous NYC landmarks include the Empire State Building, Statue of Liberty, Central Park, and Times Square.",
        help: "Try exploring the map by hovering over each borough, or use the filter panel to analyze specific data points."
    }
};

export function getTaskIntroDialogue(taskId) {
    switch(taskId) {
        case 'tree-density':
            return [
                {
                    text: "Time for your first task! Use the dropdown to switch between 1995, 2005, and 2015 data.",
                    duration: 4000
                },
                {
                    text: "Observe the map each time. Which borough seems to have the most trees overall? Click on it when you're ready.",
                    duration: 5000
                }
            ];
        case 'tree-health-change':
            return [
                {
                    text: "Next task: Analyze tree health changes. Remember: Green is Good, Orange is Fair, Red is Poor.",
                    duration: 4500
                },
                {
                    text: "Switch between the years again. Which borough shows the most noticeable difference in health colors over time? Click the borough.",
                    duration: 5500
                }
            ];
        default:
            return [
                {
                    text: "Let's see what the next task is.",
                    duration: 2000
                }
            ];
    }
}