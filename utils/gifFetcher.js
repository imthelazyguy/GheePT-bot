// utils/gifFetcher.js
const fetch = require('node-fetch');
require('dotenv').config();

const TENOR_API_KEY = process.env.TENOR_API_KEY;

async function getGif(searchTerm, nsfw = false) {
    if (!TENOR_API_KEY) {
        console.error("Tenor API Key is not configured.");
        return 'https://i.imgur.com/bYRO6wW.gif'; // A fallback "error" GIF
    }
    const safeSearch = nsfw ? 'off' : 'medium';
    const url = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(searchTerm)}&key=${TENOR_API_KEY}&limit=20&media_filter=minimal&contentfilter=${safeSearch}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (!data.results || data.results.length === 0) {
            return 'https://i.imgur.com/bYRO6wW.gif';
        }
        const randomIndex = Math.floor(Math.random() * data.results.length);
        return data.results[randomIndex].media_formats.gif.url;
    } catch (error) {
        console.error("Failed to fetch GIF from Tenor:", error);
        return 'https://i.imgur.com/bYRO6wW.gif';
    }
}

module.exports = { getGif };
