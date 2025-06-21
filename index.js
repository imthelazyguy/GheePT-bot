// index.js
// --- Core Imports ---
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, Events } = require('discord.js');
require('dotenv').config();

// --- Firebase Initialization ---
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const encodedServiceAccount = process.env.FIREBASE_PRIVATE_KEY_BASE64;
if (!encodedServiceAccount) {
    throw new Error("FIREBASE_PRIVATE_KEY_BASE64 environment variable is not set.");
}
try {
    const serviceAccountString = Buffer.from(encodedServiceAccount, 'base64').toString('utf8');
    const serviceAccount = JSON.parse(serviceAccountString);
    initializeApp({ credential: cert(serviceAccount) });
} catch (error) {
    console.error("Firebase initialization error: Invalid Base64 secret.", error);
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
console.log('Loading commands...');
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);
for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    if (!fs.statSync(commandsPath).isDirectory()) continue;
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            // THIS IS THE CRITICAL LINE THAT FIXES THE HELP COMMAND
            command.category = folder;
            client.commands.set(command.data.name, command);
            console.log(`-> Loaded command: /${command.data.name}`);
        } else {
            console.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

// --- Event Handling ---
console.log('Loading events...');
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, db));
    } else {
        client.on(event.name, (...args) => event.execute(...args, db));
    }
    console.log(`-> Loaded event: ${event.name}`);
}

// --- Background Task Initialization ---
const { triggerGheeDrop } = require('./utils/eventManager'); 
const config = require('./config');
client.once(Events.ClientReady, readyClient => {
    console.log("Setting up periodic Ghee Drop trigger...");
    setInterval(() => {
        readyClient.guilds.cache.forEach(guild => {
            if (Math.random() < 0.05) { 
                triggerGheeDrop(guild, db);
            }
        });
    }, 10 * 60 * 1000);

    console.log("Setting up periodic Voice XP granting...");
    setInterval(() => {
        readyClient.voiceUsers.forEach(async (voiceData, userId) => {
            const userRef = db.collection('users').doc(`${voiceData.guildId}-${userId}`);
            const xpGained = config.XP_PER_MESSAGE_MIN; 
            await userRef.set({
                voiceXp: FieldValue.increment(xpGained),
                spotCoins: FieldValue.increment(1) 
            }, { merge: true });
        });
    }, 5 * 60 * 1000);
});

// --- Bot Login ---
if (!process.env.DISCORD_TOKEN) {
    console.error("DISCORD_TOKEN not found in .env file. Bot cannot start.");
    process.exit(1);
}
client.login(process.env.DISCORD_TOKEN);