// utils/gifFetcher.js
const fetch = require('node-fetch');
require('dotenv').config();

const TENOR_API_KEY = process.env.TENOR_API_KEY;
const FALLBACK_GIF = 'https://i.imgur.com/bYRO6wW.gif'; // A generic "error" GIF

async function getGif(searchTerm) {
    if (!TENOR_API_KEY) {
        console.error("FATAL: TENOR_API_KEY is not configured in your environment variables. GIFs will not work.");
        return FALLBACK_GIF;
    }
    
    // The Tenor API client key is a separate parameter for public API requests.
    const CLIENT_KEY = 'gheept-discord-bot-v1';
    const url = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(searchTerm)}&key=${TENOR_API_KEY}&client_key=${CLIENT_KEY}&limit=25&media_filter=minimal&contentfilter=medium`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            console.error(`Tenor API responded with status: ${response.status}`, data);
            return FALLBACK_GIF;
        }
        if (!data.results || data.results.length === 0) {
            // If no results for specific term, try a broader search
            return getGif("anime");
        }
        
        const randomIndex = Math.floor(Math.random() * data.results.length);
        return data.results[randomIndex].media_formats.gif.url;
    } catch (error) {
        console.error("Failed to fetch GIF from Tenor:", error);
        return FALLBACK_GIF;
    }
}

module.exports = { getGif };
