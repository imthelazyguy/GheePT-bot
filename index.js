// index.js
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, Events } = require('discord.js');
require('dotenv').config();
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// --- Firebase Initialization ---
const encodedServiceAccount = process.env.FIREBASE_PRIVATE_KEY_BASE64;
// ... (rest of your Firebase init code remains the same)
initializeApp({ credential: cert(JSON.parse(Buffer.from(encodedServiceAccount, 'base64').toString('utf8'))) });
const db = getFirestore();
console.log('Successfully connected to Firestore.');

// --- Discord Client Initialization ---
const client = new Client({ intents: [ /* ... all your intents ... */ ] });

// --- Client Collections & Command/Event Handlers ---
// ... (all your existing collection, command, and event loading code remains the same) ...

// --- Background Task Initialization ---
client.once(Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);

    // =========================================================================
    // --- DEBUGGING: BACKGROUND TASKS ARE TEMPORARILY DISABLED ---
    // The silent hang is very likely caused by one of these tasks.
    // Disabling them will confirm if they are the source of the problem.
    // =========================================================================
    console.log('[DEBUG] Voice XP and Ghee Drop tasks are DISABLED for this session.');
    
    /*
    // --- Ghee Drop Trigger (DISABLED) ---
    const { triggerGheeDrop } = require('./utils/eventManager');
    console.log("Setting up periodic Ghee Drop trigger...");
    setInterval(() => { /* ... */ }, 10 * 60 * 1000);

    // --- Voice XP Granting Interval (DISABLED) ---
    const config = require('./config');
    console.log("Setting up periodic Voice XP granting...");
    setInterval(() => { /* ... */ }, 60 * 1000);
    */
});

// --- Bot Login ---
client.login(process.env.DISCORD_TOKEN);
