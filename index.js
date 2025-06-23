// =================================================================================
// --- GLOBAL ERROR HANDLERS ---
// This section will catch any crash and log it, giving us the final clue.
// =================================================================================
process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});
process.on('uncaughtException', error => {
    console.error('Uncaught exception:', error);
    process.exit(1);
});


// --- Core Imports ---
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, Events } = require('discord.js');
require('dotenv').config();
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

// --- Firebase Initialization ---
const encodedServiceAccount = process.env.FIREBASE_PRIVATE_KEY_BASE64;
if (!encodedServiceAccount) {
    throw new Error("FIREBASE_PRIVATE_KEY_BASE64 environment variable is not set.");
}
try {
    const serviceAccountString = Buffer.from(encodedServiceAccount, 'base64').toString('utf8');
    const serviceAccount = JSON.parse(serviceAccountString);
    initializeApp({ credential: cert(serviceAccount) });
} catch (error) {
    console.error("Firebase initialization error: Invalid or missing Base64 secret.", error);
    process.exit(1);
}
const db = getFirestore();
console.log('Successfully connected to Firestore.');

// --- Discord Client Initialization ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
    ]
});

// --- Client Collections for Caching & State Management ---
client.commands = new Collection();
client.voiceUsers = new Collection();
client.greetingKeywords = new Collection();
client.greetingCooldowns = new Collection();

// --- Command Handling ---
// ... (Your existing command loader loop)

// --- Event Handling ---
// ... (Your existing event loader loop)

// --- Background Task Initialization ---
const { triggerGheeDrop } = require('./utils/eventManager'); 
const config = require('./config');
client.once(Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);

    console.log("Setting up periodic Ghee Drop trigger...");
    // ... (Your setInterval for Ghee Drop)

    console.log("Setting up periodic Voice XP granting...");
    // ... (Your setInterval for Voice XP)
});

// --- Bot Login ---
client.login(process.env.DISCORD_TOKEN);
