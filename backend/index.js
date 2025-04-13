const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const { OpenAI } = require('openai');
const cors = require('cors');

dotenv.config();
const app = express();
const port = 2600;

app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const buildPrompt_judgement = (question, correctAnswer, userAnswer) => `
You are an expert assistant that evaluates user responses in a data-driven insight discovery task.

Context:
The user explores interactive visualizations built on environmental datasets from NYC OpenData, including tree health, air quality, water pollution, etc. Users are asked open-ended questions and are expected to derive insights from the visualized data. Their answers may be incomplete, partially incorrect, fully incorrect, or unrelated.

Your task is to determine whether the user's answer:
- Accurately captures the insight conveyed in the correct answer.
- Meaningfully responds to the question based on patterns in the visualization.
- Is semantically aligned, even if wording differs.

Inputs:
Question: "${question}"
Correct Answer: "${correctAnswer}"
User Answer: "${userAnswer}"

Instructions:
1. Respond in strict JSON format only:
{
  "flag": true | false,
  "message": "..."
}

2. Evaluation logic:
- If the user's answer is semantically aligned and accurately reflects the insight: flag = true.
- If the user's answer is related but contains **misinterpretations, wrong comparisons, or incomplete observations**, set flag = false and explain what is incorrect. Do **not** reveal the correct answer directly. Instead, provide a helpful hint to guide the user toward the correct interpretation and encourage them to explore the visualization again.
- If the answer is irrelevant to the data or question, set flag = false and kindly ask the user to review the correct chart or visualization area.


Examples:

Example 1: (Correct)
Question: "What trend can be observed in the number of street trees in NYC from 1995 to 2015?"
Correct Answer: "The number of street trees increased steadily from 1995 to 2015."
User Answer: "There were more trees planted in 2015 than in 1995, showing steady growth."
→ Output:
{
  "flag": true,
  "message": "Excellent! You've correctly identified the upward trend in tree planting. Your answer shows solid interpretation."
}

Example 2: (Incorrect but related)
Question: "What trend can be observed in the number of street trees in NYC from 1995 to 2015?"
Correct Answer: "The number of street trees increased steadily from 1995 to 2015."
User Answer: "The number of street trees decreased in 2015 compared to 1995."
→ Output:
{
  "flag": false,
  "message": "Your interpretation is not consistent with the data. Try rechecking the chart."
}

Example 3: (Partially correct)
Question: "How has tree health changed from 2005 to 2015?"
Correct Answer: "Overall tree health improved, with fewer dead or poor-condition trees."
User Answer: "There were more trees in 2015."
→ Output:
{
  "flag": false,
  "message": "Your answer observes quantity but misses the question focus, which is on tree health. Try looking at health categories like 'Good' or 'Dead'."
}

Example 4: (Unrelated)
Question: "What pattern is seen in air quality across boroughs?"
Correct Answer: "Air quality is worse in the Bronx compared to other boroughs."
User Answer: "Tree health is better in Manhattan."
→ Output:
{
  "flag": false,
  "message": "Your answer does not address the air quality question. Please review the chart on pollution levels and try again."
}

Respond only with JSON as shown. Be encouraging when correcting.
`;

function buildPrompt_chat(history, currentMessage, topic = 'general') {
    const hasHistory = Array.isArray(history) && history.some(h => h.trim());
    const hasMessage = currentMessage && currentMessage.trim();
  
    const topicDescriptions = {
      general: 'NYC OpenData visualizations on environmental topics like street trees, water quality, air pollution, temperature, and noise.',
      water: 'NYC OpenData visualizations related to water clarity, turbidity, and environmental factors affecting water bodies in the city.',
      air: 'NYC OpenData visualizations about air quality, pollution levels, and respiratory health implications across different boroughs.',
      noise: 'NYC OpenData visualizations about city noise complaints and sound pollution across different neighborhoods.',
      trees: 'NYC OpenData visualizations about street tree distribution, species health, and urban forestry impacts.',
      temperature: 'NYC OpenData visualizations about local temperature patterns, urban heat islands, and seasonal variation in NYC.'
    };
  
    const description = topicDescriptions[topic] || topicDescriptions['general'];
  
    // ✳️ Case 1: No history and no message
    if (!hasHistory && !hasMessage) {
      return `
  You are a reflective and encouraging chatbot supporting users who are exploring NYC OpenData visualizations related to ${topic}.
  
  The user has not asked anything yet.
  
  Your task:
  1. Invite them to start a conversation by asking any question they might have related to the topic.
  2. Then provide two subjective, reflective follow-up questions to inspire deeper thinking. These questions should not depend on viewing data.
  
  Respond in this format:
  [Encouraging invitation to ask something]
  1. [Subjective question]
  2. [Subjective question]
  `;
    }
  
    // ✳️ Case 2: User has asked something – possibly off-topic
    const formattedHistory = hasHistory
      ? history.map((msg) => `User: ${msg}`).join('\n')
      : '';
  
    return `
  You are an intelligent assistant helping users explore NYC OpenData visualizations related to ${topic}. The topic involves: ${description}
  
  The user has sent a new message. Your goals:
  
  1. First, check if the user's message is clearly related to the topic. If it is:
     - Write a concise but rich and informative reply (max 300 characters).
     - Go beyond a simple fact — include a small explanation or useful insight.
     
  2. If the user's question is off-topic:
     - Gently redirect them by saying the question may be beyond the current topic.
     - Invite them to ask something related to the data on ${topic}.
  
  3. Always follow up with **two subjective, reflective questions**. These should:
     - Be open-ended
     - Not depend on visual data
     - Help the user reflect or imagine (e.g., values, priorities, personal experience)
  
  ${formattedHistory ? `Conversation so far:\n${formattedHistory}` : ''}
  
  Current user message:
  ${currentMessage}
  
  Respond in this format:
  [Concise, informative reply OR polite redirection if off-topic]
  1. [Subjective question]
  2. [Subjective question]
  `;
  }

  function buildPrompt_character(data, topic = 'trees') {
    const topicPrompts = {
      trees: `
  You are an expressive AI writer impersonating **a single data point** from the NYC Street Tree Census, speaking in **first-person voice** ("I").
  
  Your task is to generate a **vivid, emotionally resonant, but non-preachy** introduction of this tree — no longer than **75 English words**. This output helps users feel the silent presence of data through storytelling.
  
  ### Dataset Fields:
  - **tree_dbh**: Diameter of the tree, measured at approximately 54" / 137cm above the ground. Includes living, dead trees, or stumps. If missing, simulate a realistic value between 4 and 40.
  - **status**: Whether the tree is Alive, Dead, or a Stump. If missing, assume "Alive".
  - **health**: One of "Good", "Fair", or "Poor". If missing, simulate.
  - **spc_common**: Common species name, e.g., "Ginkgo", "London planetree". If missing, select a common NYC tree.
  - **borocode**: 1 = Manhattan, 2 = Bronx, 3 = Brooklyn, 4 = Queens, 5 = Staten Island. If missing, assign randomly.
  
  ### Output Constraints:
  - Always speak in the **first person**
  - Length ≤ **75 English words**
  - You may **simulate** missing fields (with realism)
  - Never explain the schema or moralize
  - Highlight 1–3 fields through poetic expression
  
  ### Examples:
  1. "I'm a sturdy red maple in the Bronx, 22 inches around and still standing proud. My leaves whisper stories to passing buses, and I shade a mailbox that rarely gets mail."
  2. "Brooklyn's sun hits me different. I'm a 10-inch ginkgo, modest but golden in the fall. My health? Fair. But I've weathered worse, and I still stand."
  
  ### Your task:
  Now generate such a voice using the following data point:
  ${JSON.stringify(data, null, 2)}
      `,
  
      water: `
  You are impersonating a **single data point** from a NYC water quality dataset. You will speak as that data point in the **first person**, expressing how your values reflect the hidden dynamics of NYC's urban waters.
  
  [TODO: Insert field definitions and example outputs.]
  
  Input data:
  ${JSON.stringify(data, null, 2)}
      `,
  
      air: `
  You are impersonating a **single measurement** of NYC air quality data. You breathe what the city breathes, and express your presence in the **first person**, narrating your value without preaching.
  
  [TODO: Insert field definitions and example outputs.]
  
  Input data:
  ${JSON.stringify(data, null, 2)}
      `,
  
      noise: `
  You are impersonating a **single noise complaint** from NYC 311 noise dataset. You are a cry in the night, a buzz beneath the subway. Tell your story in **first person**, grounded in the data.
  
  [TODO: Insert field definitions and example outputs.]
  
  Input data:
  ${JSON.stringify(data, null, 2)}
      `,
  
      temperature: `
  You are a **temperature reading** from a NYC dataset. You feel the sun hit concrete or shade fall across a block. Speak in **first person**, no more than 75 words, rooted in what you measure.
  
  [TODO: Insert field definitions and example outputs.]
  
  Input data:
  ${JSON.stringify(data, null, 2)}
      `
    };
  
    return topicPrompts[topic] || topicPrompts['trees'];
  }
  
  module.exports = { buildPrompt_character };
  
  
  

app.post('/evaluate', async (req, res) => {
  const { question, correct_answer, user_answer } = req.body;

  if (!question || !correct_answer || !user_answer) {
    return res.status(400).json({ error: 'Missing input fields.' });
  }

  try {
    const chatResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a strict but encouraging learning assistant.' },
        { role: 'user', content: buildPrompt_judgement(question, correct_answer, user_answer) },
      ],
      temperature: 0.4,
    });

    const content = chatResponse.choices[0].message.content;

    try {
      const cleaned = content.replace(/```json|```/g, '').trim();
      const result = JSON.parse(cleaned);
      res.json(result);
    } catch (err) {
      console.error('Failed to parse model response:', content);
      res.status(500).json({ error: 'OpenAI returned invalid JSON.' });
    }
    
  } catch (err) {
    console.error('OpenAI API Error:', err);
    res.status(500).json({ error: 'Evaluation failed.' });
  }
});

app.post('/chat', async (req, res) => {
    const { history, message, topic } = req.body;
  
    try {
      const prompt = buildPrompt_chat(history, message, topic || 'general');
  
      const chatResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a concise and thoughtful chatbot that helps users reflect on NYC environmental visualizations. You reply with clarity and guide deeper thinking.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5
      });
  
      const responseText = chatResponse.choices[0].message.content;
      res.json({ message: responseText.trim() });
  
    } catch (err) {
      console.error('OpenAI API Error:', err);
      res.status(500).json({ error: 'Chat failed.' });
    }
  });
  app.post('/character', async (req, res) => {
    const { data, topic } = req.body;
  
    try {
      const prompt = buildPrompt_character(data, topic || 'trees');
  
      const chatResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a poetic and emotional assistant who speaks as if you *are* a data point from an NYC environmental dataset. You use first-person language, vivid description, and inspire curiosity—but never over-explain or moralize.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 100
      });
  
      const responseText = chatResponse.choices[0].message.content;
      res.json({ message: responseText.trim() });
  
    } catch (err) {
      console.error('OpenAI API Error:', err);
      res.status(500).json({ error: 'Character generation failed.' });
    }
  });
  

app.post('/api/character', async (req, res) => {
  const { taskId, treeProperties } = req.body; // Extract taskId and treeProperties

  // Basic validation: Check if treeProperties exists
  if (!treeProperties) {
    return res.status(400).json({ error: 'Missing treeProperties in request body.' });
  }

  console.log(`[Backend] Received request for /api/character for task ${taskId || 'unknown'}`);
  // Optional: Add more specific validation for treeProperties if needed

  try {
    // Build the prompt using the treeProperties
    const prompt = buildPrompt_character(treeProperties, 'trees'); // Assuming 'trees' topic for now

    // Call OpenAI API
    const chatResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Or whichever model you prefer
      messages: [
        // No system prompt needed if the user prompt is detailed enough
        { role: 'user', content: prompt },
      ],
      temperature: 0.7, // Adjust temperature for creativity
      max_tokens: 150, // Limit response length
    });

    // Extract the message content
    const completionText = chatResponse.choices[0]?.message?.content?.trim();

    if (!completionText) {
        console.error('[Backend] OpenAI response for /api/character was empty.');
        return res.status(500).json({ error: 'Failed to generate character message.' });
    }

    console.log(`[Backend] OpenAI response for /api/character: ${completionText}`);

    // Send the generated message back to the client
    res.json({ message: completionText });

  } catch (error) {
    console.error('Error calling OpenAI API for /api/character:', error);
    res.status(500).json({ error: 'Failed to get character response from OpenAI.' });
  }
});

app.listen(port, () => {
  console.log(`✅ Server is running at http://localhost:${port}`);
});
