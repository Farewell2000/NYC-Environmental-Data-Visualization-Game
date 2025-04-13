# Backend APIs

A local Express.js backend to evaluate user answers against correct insights using OpenAI GPT-4o, specifically for NYC OpenData visualization-based tasks.
## APIs
| Endpoint       | Purpose                                                                 | Notes                                  |
|----------------|-------------------------------------------------------------------------|----------------------------------------|
| `/evaluate`    | Judgement API to assess if a user’s insight matches the visualization  | Returns pass/fail flag with explanation |
| `/chat`        | Dialogue API for topic-aware reflective conversation                   | Encourages deeper exploration           |
| `/character`   | Personified storytelling based on data points                          | Generates first-person data narratives  |

> 📊 Topics supported: `trees` (active), `water`, `air`, `noise` (planned), `temperature` .


## Setup

1. Install Node.js and npm.
2. Run the following commands:

```bash
npm install
cp .env.example .env  # Then replace with your actual API key
npm start
```

---

## API: `/evaluate` – Judgement Endpoint

![Judgement API Diagram](./figure_api_judgement.png)
> ⚠️ **Caution:** This API strictly evaluates answer accuracy and **does not** include the *"encourage further questioning"* logic.

### POST `/evaluate`

**Request Body:**

```json
{
  "question": "string",
  "correct_answer": "string",
  "user_answer": "string"
}
```

**Response:**

```json
{
  "flag": true | false,
  "message": "..."
}
```

### Sample: Test Cases for Evaluation Endpoint

#### ✅ Example 1: Correct Answer (Semantically Aligned)

**Request:**
```bash
curl -X POST http://localhost:2600/evaluate -H "Content-Type: application/json" -d "{\"question\":\"What trend can be observed in the number of street trees in NYC from 1995 to 2015?\",\"correct_answer\":\"The number of street trees increased steadily from 1995 to 2015.\",\"user_answer\":\"There were more trees planted in 2015 than in 1995, showing steady growth.\"}"
```

**Response:**
```json
{
  "flag": true,
  "message": "Excellent! You've correctly identified the upward trend in tree planting. Your answer shows solid interpretation."
}
```

---

#### ❌ Example 2: Incorrect but On-Topic (Misinterpretation)

**Request:**
```bash
curl -X POST http://localhost:2600/evaluate -H "Content-Type: application/json" -d "{\"question\":\"What trend can be observed in the number of street trees in NYC from 1995 to 2015?\",\"correct_answer\":\"The number of street trees increased steadily from 1995 to 2015.\",\"user_answer\":\"The number of trees declined during this period due to urban development.\"}"
```

**Response:**
```json
{
  "flag": false,
  "message": "Your interpretation is not consistent with the data. The number of street trees actually increased from 1995 to 2015. Please review the visualization to see the upward trend."
}
```

---

#### ❌ Example 3: Off-Topic (Irrelevant Answer)

**Request:**
```bash
curl -X POST http://localhost:2600/evaluate -H "Content-Type: application/json" -d "{\"question\":\"What pattern is seen in air quality across boroughs?\",\"correct_answer\":\"Air quality is worse in the Bronx compared to other boroughs.\",\"user_answer\":\"Tree health is better in Manhattan.\"}"
```

**Response:**
```json
{
  "flag": false,
  "message": "Your answer does not address the air quality question. Please review the chart on pollution levels and try again."
}
```

---

## API: `/chat` – Reflective Dialogue Endpoint

![Chatbot API Diagram](./figure_api_chat.png)

> 💬 This endpoint enables interactive conversations based on NYC OpenData environmental visualizations. The assistant gives meaningful answers and encourages further reflection.

### POST `/chat`

**Request Body:**

```json
{
  "history": ["string", "string", ...],
  "message": "string",
  "topic": "trees" | "water" | "air" | "noise" | "temperature" | "general"
}
```

- `history`: an array of previous messages (user side only)
- `message`: the latest user message
- `topic`: the current theme (affects prompt customization)

**Response:**

```json
{
  "message": "..."
}
```

---

### Sample: Test Cases for Chat Endpoint

#### 🟢 Example 1: No history or input, topic is `trees`

```bash
curl -X POST http://localhost:2600/chat -H "Content-Type: application/json" -d "{\"history\":[],\"message\":\"\",\"topic\":\"trees\"}"
```

#### 🟢 Example 2: No history, one new user message (trees)

```bash
curl -X POST http://localhost:2600/chat -H "Content-Type: application/json" -d "{\"history\":[],\"message\":\"Why are there more trees in some neighborhoods than others?\",\"topic\":\"trees\"}"
```

#### 🟢 Example 3: Continued conversation on trees

```bash
curl -X POST http://localhost:2600/chat -H "Content-Type: application/json" -d "{\"history\":[\"Why do some neighborhoods have more street trees?\"],\"message\":\"Do trees really help reduce city noise?\",\"topic\":\"trees\"}"
```

---

## API: `/character` – Personified Data Endpoint

![Character API Diagram](./figure_api_character.png)

> **This endpoint generates short, emotionally expressive first-person narratives based on NYC environmental data points.**  
> It brings data alive through vivid and grounded storytelling — especially useful for design inspiration, public education, and data engagement.

---

### POST `/character`

**Request Body:**

```json
{
  "data": {
    "tree_dbh": 19,
    "status": "Alive",
    "health": "Fair",
    "spc_common": "Ginkgo",
    "borocode": 2
  },
  "topic": "trees"
}
```

- `data`: A partial or complete dictionary representing a single data point from the selected environmental dataset.
- `topic`: Current dataset category. Supports:
  - `"trees"` (Implemented)
  - `"water"`, `"air"`, `"noise"`, `"temperature"` (Placeholders ready for expansion)

**Response:**

```json
{
  "message": "I stand firm in the Bronx, a Ginkgo with 19 inches of history in my trunk. Fair in health, but faithful to this block, I’ve seen the school bell ring through many seasons."
}
```

---

### Sample: Test Cases for Character Endpoint

#### ✅ Example 1: Full Tree Data (All Attributes Provided)

```cmd
curl -X POST http://localhost:2600/character -H "Content-Type: application/json" -d "{\"data\":{\"tree_dbh\":19,\"status\":\"Alive\",\"health\":\"Fair\",\"spc_common\":\"Ginkgo\",\"borocode\":2},\"topic\":\"trees\"}"
```

**Expected Response:**

```json
{
  "message": "I stand firm in the Bronx, a Ginkgo with 19 inches of history in my trunk. Fair in health, but faithful to this block, I’ve seen the school bell ring through many seasons."
}
```

---

#### ✅ Example 2: Partial Tree Data (Missing `tree_dbh`, `status`, `health`)

```cmd
curl -X POST http://localhost:2600/character -H "Content-Type: application/json" -d "{\"data\":{\"spc_common\":\"Callery pear\",\"borocode\":1},\"topic\":\"trees\"}"
```

**Expected Response:**

```json
{
  "message": "I bloom near the curb in Manhattan — a Callery pear, perhaps 14 inches wide if anyone’s counting. They never noted my health, but I’ve still got white petals dancing in spring breeze."
}
```

---

## Topics Support

| Topic        | Status     | Description                            |
|--------------|------------|----------------------------------------|
| `trees`      | ✅ Active   | NYC Street Tree Census                 |
| `water`      | 🚧 Planned | Water quality & turbidity              |
| `air`        | 🚧 Planned | Air quality & pollution measures       |
| `noise`      | 🚧 Planned | Noise complaints from 311 dataset(TODO)        |
| `temperature`| 🚧 Planned | Local temperature and heat variation   |

---

## License

MIT License
