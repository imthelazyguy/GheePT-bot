// utils/gifFetcher.js
const fetch = require('node-fetch');
require('dotenv').config();

const TENOR_API_KEY = process.env.TENOR_API_KEY;
const FALLBACK_GIF = 'https://i.imgur.com/bYRO6wW.gif';

async function getGif(searchTerm) {
    if (!TENOR_API_KEY) {
        console.error("TENOR_API_KEY is not configured!");
        return FALLBACK_GIF;
    }
    const url = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(searchTerm)}&key=${TENOR_API_KEY}&limit=25&media_filter=minimal&contentfilter=medium`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Tenor API responded with status: ${response.status}`);
            return FALLBACK_GIF;
        }
        const data = await response.json();
        if (!data.results || data.results.length === 0) return FALLBACK_GIF;
        const randomIndex = Math.floor(Math.random() * data.results.length);
        return data.results[randomIndex].media_formats.gif.url;
    } catch (error) {
        console.error("Failed to fetch GIF from Tenor:", error);
        return FALLBACK_GIF;
    }
}

module.exports = { getGif };
