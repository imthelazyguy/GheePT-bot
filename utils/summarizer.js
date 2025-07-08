// utils/summarizer.js
const { CohereClient } = require('@cohere-ai/cohere');
require('dotenv').config();

const cohere = new CohereClient({ token: process.env.COHERE_API_KEY });

async function summarizeText(text) {
    if (!process.env.COHERE_API_KEY) {
        return "Can't summarize, my brain's API key is missing.";
    }

    try {
        const prediction = await cohere.summarize({
            text: text,
            length: 'short',
            format: 'paragraph',
            model: 'command-r',
            temperature: 0.3,
        });
        return prediction.summary;
    } catch (error) {
        console.error("Error summarizing text with Cohere:", error);
        return "My brain is too fried to summarize that wall of text right now.";
    }
}

module.exports = { summarizeText };
