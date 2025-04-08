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
│       ├── chat.css
│       ├── dialogue.css
│       ├── filter-panel.css
│       ├── map.css
│       └── task-panel.css
├── data/
│   ├── new-york-city-boroughs.json
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

- **Filtering Panel Component**: Used to filter data based on dataset attributes.

- **Legend Component**: Displays the map legend.

- **Dialogue Window Component**: Contains an avatar and displays corresponding dialogue content based on the current game progress.

- **Task Panel Component**: Displays the current task.

- **Natural Language Interaction Area Component**: A chatbot that enables fixed-logic conversations with the user.

## Game Tasks
Currently, the game includes two tasks:

- **Tree 1**: Overlay a dot map on the geo map, where the color of each dot varies based on tree health status. The health status is determined by the "status" attribute in the CSV file, which includes "Fair", "Good", and "Poor". The Filtering Panel allows the user to switch between different years only. In this stage, the user needs to answer which area has the most trees. If answered correctly, they pass the stage.

- **Tree 2**: Also overlays a dot map on the geo map, with dot colors based on tree health status. The Filtering Panel allows the user to switch between different years only. In this stage, the user needs to answer which area's tree health status changes the most over time. A correct answer lets the user pass the stage.