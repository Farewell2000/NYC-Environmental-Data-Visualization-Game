# NYC Environmental Data Visualization Game

## Overview
This project is an interactive game that visualizes environmental data (street trees and noise complaints) on a map of New York City. Users interact with different map layers, filter data, and complete tasks guided by a chatbot and dialogue prompts. The game includes a backend server using Express.js and OpenAI's GPT-4o to evaluate user responses and provide conversational feedback.

## Project Structure

```
.
├── index.html                 # Main HTML file
├── assets/
│   └── avatars/
│       └── cartoon-avatar.png # Avatar image
├── css/                       # CSS style files
│   ├── main.css
│   └── components/
│       ├── chatbot.css
│       ├── dialogue.css
│       ├── filter-panel.css
│       ├── map.css
│       └── task-panel.css
├── data/                      # Data files
│   ├── new-york-city-boroughs.json # Borough geographic boundaries
│   ├── noise/
│   │   └── Noise_Complaints.csv    # Noise complaint data
│   └── tree/
│       ├── 1995_Street_Tree.csv    # Street tree census data
│       ├── 2005_Street_Tree.csv
│       └── 2015_Street_Tree.csv
├── js/                        # JavaScript files
│   ├── main.js                # Main entry point, initializes components, connects logic
│   ├── utils/
│   │   └── data-loader.js     # Utility functions for loading data
│   ├── game/
│   │   ├── dialogues.js       # Defines dialogue content functions
│   │   ├── game-state.js      # Manages game state (current task, completed tasks, chat history, etc.)
│   │   └── tasks.js           # Defines all tasks and their properties (questions, answers, data types, etc.)
│   └── components/
│       ├── map.js             # Map component (Leaflet) logic
│       ├── chatbot.js         # Chatbot component, handles user input and backend API calls (/evaluate, /chat)
│       ├── dialogue.js        # Dialogue window component
│       ├── filter-panel.js    # Filter panel component
│       ├── legend.js          # Legend component
│       └── task-panel.js      # Task panel component
└── backend/                   # Backend Express server
    ├── index.js               # Express server code, handles API requests (/evaluate, /chat, /character)
    ├── package.json           # Node.js project dependencies
    ├── package-lock.json      # Locked dependency versions
    ├── node_modules/          # Installed Node.js modules (e.g., express, openai, cors)
    ├── .env                   # Environment variables (e.g., OPENAI_API_KEY)
    └── README.md              # Backend documentation
```

## Components

-   **Map Component**: Visualizes the NYC map using Leaflet. Displays different data layers (points for trees, choropleth for noise) depending on the current task. Allows interaction with map elements (tree points, boroughs).
-   **Filtering Panel Component**: Allows users to filter the data displayed on the map based on specific attributes relevant to the current task.
    -   *Tree Tasks*: Filter by year (1995, 2005, 2015).
    -   *Noise Task*: Filter by noise complaint type.
-   **Legend Component**: Displays the map legend, explaining the visual encoding (e.g., point colors, choropleth scale).
-   **Dialogue Window Component**: Displays an avatar and dialogue text relevant to the current game state or user interaction (e.g., clicking a map element). Fetches dynamic dialogue content via the backend `/character` API for tree tasks.
-   **Task Panel Component**: Shows the list of game tasks.
    -   Tasks are displayed as sequential cards.
    -   The current task is highlighted.
    -   Future tasks are disabled.
    -   Completed tasks are marked green and remain selectable.
    -   Users manually switch tasks by clicking on the cards after completing the current one.
-   **Natural Language Interaction Area (Chatbot)**: Allows users to interact with the game using natural language.
    -   Handles user input and communicates with the backend (`/evaluate`, `/chat` APIs).
    -   Conversation history is stored per task and updates when the user switches tasks.
    -   Used to submit answers for evaluation in some tasks.

## Backend

-   A local Express.js server handles API requests.
-   Uses OpenAI GPT-4o for evaluating user answers and generating chat responses.
-   **API Endpoints:**
    -   `/evaluate`: Evaluates user input against the correct insights for a task, returning a `pass`/`fail` flag. Used for passing Tree 1 and Tree 2 tasks.
    -   `/chat`: Provides conversational responses based on user input after a task is completed or during specific interaction flows.
    -   `/character`: Generates dialogue text based on the properties of a selected map element (e.g., a specific tree's status). Used in the Dialogue Window for Tree 1 and Tree 2.
-   Requires an `.env` file with an `OPENAI_API_KEY`.

## Game Tasks

Currently, the game includes six tasks, divided into two categories:

**Tree Tasks (Tasks 1-3): Tree Health Visualization**

*   **Goal**: Analyze changes in street tree health over different years.
*   **Visualization**: Displays street tree data (from 1995, 2005, 2015 datasets) as individual points on the map. The color of each point corresponds to the tree's health status (`status`: "Good", "Fair", "Poor") as recorded in the census for that year.
*   **Filtering**: The Filtering Panel allows users to select the **Year** (1995, 2005, or 2015) using a dropdown menu to view the corresponding dataset.
*   **Interaction**:
    *   Clicking on a specific tree point reveals its common species name (`spc_common`), latitude, and longitude (typically shown in a map popup or console).
    *   Simultaneously, the Dialogue Window updates with a message specific to the clicked tree's health status (`status`), fetched dynamically from the backend `/character` API.
*   **Passing Condition (All Tree Tasks)**: The user must provide insights or answer questions related to the data via the Chatbot. The input is sent to the backend `/evaluate` endpoint, which returns a `pass`/`fail` flag. A `pass` allows the user to proceed.
*   **Post-Completion**: After passing, the Chatbot interactions switch from evaluation (`/evaluate`) to general conversation (`/chat`).

**Noise Tasks (Tasks 4-6): Noise Complaint Analysis**

*   **Goal**: Analyze patterns in noise complaints across different boroughs and types.
*   **Visualization**: Displays noise complaint data aggregated by NYC borough using a choropleth map. The color intensity of each borough represents the relative frequency or count of noise complaints based on the selected filters.
*   **Filtering**: The Filtering Panel allows users to select one or more **Noise Complaint Types** using checkboxes.
*   **Interaction**:
    *   Hovering over a borough displays a tooltip showing the borough name and potentially relevant data (e.g., complaint count for the selected type).
    *   Clicking on a borough updates the Dialogue Window with a message relevant to that borough and the noise task context.
*   **Passing Condition (All Noise Tasks)**: Similar to the tree tasks, the user must provide insights or answer questions via the Chatbot. The input is evaluated by the backend `/evaluate` endpoint, returning a `pass`/`fail` flag.
*   **Post-Completion**: After passing, the Chatbot interactions switch from evaluation (`/evaluate`) to general conversation (`/chat`).