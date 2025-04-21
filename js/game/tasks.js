// Export the list of all tasks
export const ALL_TASKS = [
    {
        id: 'tree-1',
        title: 'Tree Task 1: Concentration',
        description: 'In which year during the three years do "Poor" trees (red dots) appear most concentrated in all boroughs?',
        instructions: `Open the map and switch between 1995, 2005, and 2015.

You can filter or display only the "Poor" (red) trees and observe their distribution citywide or by district.

Compare the three years and visually determine which year has the densest cluster of red dots, and which year appears the most dispersed or has the fewest red dots.`,
        correctAnswer: `The red dots were densest in 1995 (around 68,500 trees), followed by 2005 (approximately 56,215 trees), and least in 2015 (about 26,818 trees). This suggests an overall improvement in the health of street trees over the 20 years, with "Poor" conditions becoming rarer and more dispersed by 2015.`,
        dataType: 'tree',
        initialYear: '2015', // Default year or relevant setting
        question: 'In which year during the three years do "Poor" trees (red dots) appear most concentrated in all boroughs?', // Pass description as question
        points: 30, // Example points
    },
    {
        id: 'tree-2',
        title: 'Tree Task 2: Change in "Good"',
        description: 'Comparing 1995 and 2015, which borough saw the most significant change in "Good" trees (green dots) in all boroughs?',
        instructions: `Switch the map to 1995 and show only "Good" (green) trees. Observe each borough's general range or density of green trees (e.g., Bronx, Brooklyn).

Then, switch to 2015 and focus on "Good" trees again. Compare the two years: where do you see the most visual increase in green dots?

Make a simple judgment on which borough saw the most significant increase.`,
        correctAnswer: `Queens had relatively few green dots in 1995 (about 27,840 trees), but by 2015, this number increased dramatically (about 194,008 trees), showing the most significant growth. This suggests that Queens invested heavily in street tree planting or maintenance during this period.`,
        dataType: 'tree',
        initialYear: '2015', // Default year or relevant setting
        question: 'Comparing 1995 and 2015, which borough saw the most significant change in "Good" trees (green dots) in all boroughs?', // Pass description as question
        points: 35, // Example points
    },
    {
        id: 'tree-3',
        title: 'Tree Task 3: Brooklyn Color Shift',
        description: 'Focus on the Brooklyn—how does the color distribution change across the three years?',
        instructions: `Choose a familiar area (such as where you live or frequently visit).

Switch to 1995, 2005, and 2015, respectively. No need to count trees—just observe the color patterns: are they shifting from red/orange (Poor/Fair) to green (Good), or do red dots still dominate?

Based on personal observations or memory, hypothesize possible reasons (e.g., roadwork, redevelopment, replanting efforts).`,
        correctAnswer: `In a street I know well in Brooklyn, the 1995 map showed many red (Poor) and orange (Fair) trees. By 2005, the red ones had decreased; in 2015, most had turned green (Good). This aligns with my memory of major street renovations and tree replanting after 2010, suggesting that urban renewal projects contributed positively to tree health.`,
        dataType: 'tree',
        initialYear: '2015', // Default year or relevant setting
        question: 'Focus on the Brooklyn—how does the color distribution change across the three years?', // Pass description as question
        points: 35, // Example points
    },
    {
        id: 'noise-1',
        title: 'Noise Task 1: Overall Concentration',
        description: 'Where in the city are noise complaints most heavily concentrated, regardless of type?',
        instructions: `View all noise complaint markers on the map or heatmap, or color density layer to identify high-density regions.

Compare between boroughs or between key neighborhoods within the same borough.

Based on your knowledge, suggest possible reasons (e.g., business districts, bar streets, busy traffic corridors).`,
        correctAnswer: 'From the heatmap distribution, Manhattan and Brooklyn had the highest concentration of complaints. This could be due to large crowds and active nightlife, resulting in more music and street noise',
        dataType: 'noise',
        initialNoiseType: 'All', // Keep map showing all types initially
        question: 'Where in the city are noise complaints most heavily concentrated, regardless of type?',
        points: 30,
    },
    {
        id: 'noise-2',
        title: 'Noise Task 2: Type Comparison',
        description: 'Compare two main types of noise (e.g., "commercial noise" and "street/sidewalk noise"). Can you identify distribution differences on the map?',
        instructions: `Use the map filters to select only "commercial noise." Observe its distribution and density (darker colors indicate more complaints).

Then select only "street/sidewalk noise." Compare the locations and clustering patterns of both.

Briefly determine which type is more widespread or where their distributions differ most.`,
        correctAnswer: 'Brooklyn has the highest number of commercial noise complaints, while Staten Island reports the fewest in this category. For street or sidewalk noise, Manhattan leads with the most complaints, followed by the Bronx and Brooklyn. Again, Staten Island has the lowest number of complaints in this category.',
        dataType: 'noise',
        initialNoiseType: 'All', // Start with all, user needs to filter
        question: 'Compare two main types of noise (e.g., "commercial noise" and "street/sidewalk noise"). Can you identify distribution differences on the map?',
        points: 35,
    },
    {
        id: 'noise-3',
        title: 'Noise Task 3: Borough Deep Dive',
        description: 'Take any borough you are interested in and look at the distribution of various types of noise on the map: Which types of noise occur most frequently?',
        instructions: `Select the borough you're interested in (e.g., Brooklyn). If the interface provides filters, switch to the view showing only that borough.

Identify which noise categories have the highest complaint counts or the darkest "hot spots" on the map.

Consider the functional layout of the city and propose possible explanations for the concentrated noise.`,
        correctAnswer: 'I focused on Brooklyn and reviewed various noise categories (Residential, Vehicle, Street/Sidewalk, and Commercial). Vehicle Noise clustered around highways, Street/Sidewalk Noise was high in busy commercial areas (like Atlantic Avenue), and Commercial Noise concentrated in nightlife spots.',
        dataType: 'noise',
        initialNoiseType: 'All', // Start with all, user needs to filter/focus
        question: 'Take any borough you are interested in and look at the distribution of various types of noise on the map: Which types of noise occur most frequently?',
        points: 35,
    }
];
