// index.js
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, Events } = require('discord.js');
require('dotenv').config();
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

// --- Firebase Initialization ---
const encodedServiceAccount = process.env.FIREBASE_PRIVATE_KEY_BASE64;
// ... (rest of your Firebase init code)
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

// --- Client Collections ---
client.commands = new Collection();
client.voiceUsers = new Collection();
client.greetingKeywords = new Collection();
client.greetingCooldowns = new Collection();

// --- Command & Event Handling ---
// ... (Your existing command and event loader loops)

// --- Background Task Initialization ---
const { triggerGheeDrop } = require('./utils/eventManager'); 
const config = require('./config');
client.once(Events.ClientReady, readyClient => {
    // Ghee Drop Event Trigger
    console.log("Setting up periodic Ghee Drop trigger...");
    setInterval(() => {
        if (process.env.DEBUG_MODE === 'true') console.log('[DEBUG] Running Ghee Drop check...');
        readyClient.guilds.cache.forEach(guild => {
            if (Math.random() < 0.05) {
                triggerGheeDrop(guild, db);
            }
        });
    }, 10 * 60 * 1000);

    // Voice XP Granting Interval
    console.log("Setting up periodic Voice XP granting...");
    setInterval(() => {
        if (process.env.DEBUG_MODE === 'true') console.log(`[DEBUG] Running Voice XP check for ${readyClient.voiceUsers.size} users.`);
        readyClient.voiceUsers.forEach(async (voiceData, userId) => {
            const userRef = db.collection('users').doc(`${voiceData.guildId}-${userId}`);
            const xpGained = config.XP_PER_MESSAGE_MIN; 
            await userRef.set({
                voiceXp: FieldValue.increment(xpGained),
                spotCoins: FieldValue.increment(1) 
            }, { merge: true });
        });
        if (process.env.DEBUG_MODE === 'true') console.log('[DEBUG] Finished Voice XP check.');
    }, 5 * 60 * 1000);
});

// --- Bot Login ---
client.login(process.env.DISCORD_TOKEN);
