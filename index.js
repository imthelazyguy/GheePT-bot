// index.js
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

// --- Client Collections & Handlers ---
client.commands = new Collection();
client.voiceUsers = new Collection();
client.greetingKeywords = new Collection();
client.greetingCooldowns = new Collection();
// ... (Your existing command and event loader loops should remain here) ...

// --- Background Task Initialization ---
client.once(Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
    console.log("Bot is in a stable state. Background tasks are temporarily disabled for debugging.");

    /*
    // The background tasks are disabled below to find the source of the hang.
    // We will re-enable them one by one to isolate the issue.
    
    // const { triggerGheeDrop } = require('./utils/eventManager'); 
    // const config = require('./config');

    // // Ghee Drop Event Trigger (DISABLED)
    // setInterval(() => {
    //     readyClient.guilds.cache.forEach(guild => {
    //         if (Math.random() < 0.05) { 
    //             triggerGheeDrop(guild, db);
    //         }
    //     });
    // }, 10 * 60 * 1000);

    // // Voice XP Granting Interval (DISABLED)
    // setInterval(() => {
    //     const promises = [];
    //     readyClient.voiceUsers.forEach((voiceData, userId) => {
    //         const userRef = db.collection('users').doc(`${voiceData.guildId}-${userId}`);
    //         const promise = userRef.set({
    //             voiceXp: FieldValue.increment(config.XP_PER_VOICE_MINUTE),
    //             spotCoins: FieldValue.increment(1) 
    //         }, { merge: true });
    //         promises.push(promise);
    //     });

    //     Promise.all(promises)
    //         .catch(error => console.error("Error during batch voice XP update:", error));
    // }, 60 * 1000);
    */
});

// --- Bot Login ---
if (!process.env.DISCORD_TOKEN) {
    console.error("DISCORD_TOKEN not found. Bot cannot start.");
    process.exit(1);
}
client.login(process.env.DISCORD_TOKEN);

