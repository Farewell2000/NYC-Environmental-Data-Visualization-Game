# NYC Environmental Data Visualization Game

## Project Structure
```
.
├── index.html
├── assets/
│   └── avatars/
│       └── cartoon-avatar.png
├── css/
│   ├── main.css
│   └── components/
│       ├── chatbot.css
│       ├── dialogue.css
│       ├── filter-panel.css
│       ├── map.css
│       └── task-panel.css
├── data/
│   ├── new-york-city-boroughs.json
│   ├── noise/
│   │   └── Noise_Complaints.csv
│   └── tree/
│       ├── 1995_Street_Tree.csv
│       ├── 2005_Street_Tree.csv
│       └── 2015_Street_Tree.csv
└── js/
    ├── main.js
    ├── utils/
    │   └── data-loader.js
    ├── game/
    │   ├── dialogues.js
    │   ├── game-state.js
    │   └── tasks.js
    └── components/
        ├── map.js
        ├── chatbot.js
        ├── dialogue.js
        ├── filter-panel.js
        ├── legend.js
        └── task-panel.js
```

## Overview
This is a data visualization game based on the NYC city map.

## Components
The functionalities of the different components are as follows:

- **Map Component**: Visualizes the NYC map.

- **Filtering Panel Component**: Used to filter data based on dataset attributes. In Tree 1 and Tree 2 tasks, it filters by year; in Noise 1 task, it filters by noise type.

- **Legend Component**: Displays the map legend.

- **Dialogue Window Component**: Contains an avatar and displays corresponding dialogue content based on the current game progress.

- **Task Panel Component**: Displays tasks. Supports displaying both historical and future tasks. All tasks are arranged in cards from top to bottom in order. The current task is highlighted, future tasks are not selectable, and past completed tasks turn green and remain selectable. When the current task is completed, its card turns green, and the next task card becomes selectable. Task transitions are not automatic—users must manually click on task cards to switch between them.

- **Natural Language Interaction Area Component**: A chatbot that enables fixed-logic conversations with the user. Conversation history for different tasks is stored and updated accordingly when users switch between tasks.

## Game Tasks
Currently, the game includes three tasks:

- **Tree 1**: Overlays a dot map on the geo map, where dot colors vary based on tree health status. The health status is determined by the "status" attribute in the CSV file, which includes "Fair", "Good", and "Poor". The Filtering Panel allows the user to switch between different years only. Users can interact with each tree point—clicking on a point displays the tree's "spc_common" attribute, longitude, and latitude. The dialogue panel shows corresponding dialogue based on the point's "status" parameter (three different dialogues). To pass this task, the system detects when the user inputs specific text in the Natural Language Interaction Area, such as "Brooklyn".

- **Tree 2**: Also overlays a dot map on the geo map, with dot colors based on tree health status. The Filtering Panel allows the user to switch between different years only. Users can interact with each tree point—clicking on a point displays the tree's "spc_common" attribute, longitude, and latitude. The dialogue panel shows corresponding dialogue based on the point's "status" parameter (three different dialogues). To pass this task, the system detects when the user inputs specific text in the Natural Language Interaction Area, such as "Brooklyn".

- **Noise 1**: Uses a choropleth map to visualize noise data. The Filtering Panel allows the user to switch between different noise types only. Users can interact with borough areas—clicking on a borough displays corresponding dialogue in the dialogue panel. To pass this task, the system detects when the user inputs specific text in the Natural Language Interaction Area, such as "Brooklyn".