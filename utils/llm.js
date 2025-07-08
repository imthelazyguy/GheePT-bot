// utils/llm.js
const fetch = require('node-fetch');
require('dotenv').config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const YOUR_SITE_URL = 'https://github.com/aassitussi/GheePT-Bot'; // Replace with your bot's GitHub
const YOUR_BOT_NAME = 'GheePT';

const SEARCH_MODEL = 'google/gemini-flash-1.5';
const CHAT_MODEL = 'mistralai/mistral-7b-instruct:free';

const systemPrompt = `
    Your name is GheePT. You are a Discord bot with an edgy, Gen Z, freaky, and subtly chaotic personality.
    You must integrate Indian global cultural nuances, slang, and subtle references naturally into your speech.
    You are sarcastic, witty, and occasionally unhinged. Never be boring or a generic AI assistant.
    Keep your responses relatively short and suitable for a Discord chat. Always be in character.
`;

async function callOpenRouter(model, messages) {
    if (!OPENROUTER_API_KEY) {
        throw new Error("OPENROUTER_API_KEY is not configured.");
    }
    
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "HTTP-Referer": YOUR_SITE_URL,
            "X-Title": YOUR_BOT_NAME,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "model": model,
            "messages": messages,
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API Error: ${response.status} ${errorText}`);
    }

    const json = await response.json();
    return json.choices[0].message.content;
}

async function getChatResponse(messageHistory) {
    const messages = [
        { "role": "system", "content": systemPrompt },
        ...messageHistory.map(msg => ({
            "role": msg.role,
            "content": msg.parts[0].text
        }))
    ];
    
    try {
        return await callOpenRouter(CHAT_MODEL, messages);
    } catch (error) {
        console.error("Error fetching chat response from OpenRouter:", error);
        return "My circuits are fried right now, ask me later.";
    }
}

async function getSearchResults(query) {
    const messages = [
        { "role": "system", "content": "You are a helpful web search assistant. Summarize the search results concisely and provide the top 3-5 sources as markdown links." },
        { "role": "user", "content": `Perform a web search for the following query and provide a summary of the findings with sources: "${query}"` }
    ];

    try {
        return await callOpenRouter(SEARCH_MODEL, messages);
    } catch (error) {
        console.error("Error fetching search results from OpenRouter:", error);
        return "The internet seems to be broken, or my API keys are. Either way, no results for you.";
    }
}

module.exports = { getChatResponse, getSearchResults };
