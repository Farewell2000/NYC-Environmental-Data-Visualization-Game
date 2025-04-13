const BACKEND_URL = 'http://localhost:2600';

/**
 * Calls the /evaluate endpoint.
 * @param {string} question - The task question.
 * @param {string} correctAnswer - The expected correct answer insight.
 * @param {string} userAnswer - The user's submitted answer.
 * @returns {Promise<object>} - The response JSON { flag: boolean, message: string }.
 */
export async function evaluateAnswer(question, correctAnswer, userAnswer) {
    console.log(`[API Client] Calling /evaluate`);
    const response = await fetch(`${BACKEND_URL}/evaluate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            question: question,
            correct_answer: correctAnswer,
            user_answer: userAnswer,
        }),
    });
    if (!response.ok) {
        const errorText = await response.text();
        console.error(`[API Client] /evaluate Error ${response.status}: ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    return await response.json();
}

/**
 * Calls the /chat endpoint.
 * @param {string[]} history - Previous user messages in the current task context.
 * @param {string} message - The latest user message.
 * @param {string} [topic='general'] - The topic context for the chat.
 * @returns {Promise<object>} - The response JSON { message: string }.
 */
export async function getChatResponse(history, message, topic = 'general') {
    console.log('[api-client] getChatResponse called with:', { history, message, topic });
    const endpoint = `${BACKEND_URL}/chat`;
    const bodyPayload = {
        history: history || [],
        message: message || '',
        topic: topic
    };
    console.log('[api-client] Sending body payload to /chat:', bodyPayload);
    console.log('[api-client] Sending stringified body to /chat:', JSON.stringify(bodyPayload));

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyPayload),
    });
     if (!response.ok) {
        const errorText = await response.text();
        console.error(`[API Client] /chat Error ${response.status}: ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    return await response.json();
}

/**
 * Calls the /character endpoint for tree interactions.
 * @param {string} taskId - The current task ID.
 * @param {object} treeProperties - Properties of the clicked tree (status, spc_common, latitude, longitude).
 * @returns {Promise<object>} - The response JSON { message: string }.
 */
export async function getCharacterDialogue(taskId, treeProperties) {
    console.log(`[API Client] Calling /character`);
    const response = await fetch(`${BACKEND_URL}/character`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            taskId: taskId,
            treeProperties: treeProperties,
        }),
    });
     if (!response.ok) {
        const errorText = await response.text();
        console.error(`[API Client] /character Error ${response.status}: ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    return await response.json();
}
