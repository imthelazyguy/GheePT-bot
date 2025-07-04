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

// --- Client Collections for Caching & State Management ---
client.commands = new Collection();
client.voiceUsers = new Collection();
client.greetingKeywords = new Collection();
client.greetingCooldowns = new Collection();
client.activeRouletteGames = new Map(); // For the multiplayer roulette game state

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
            command.category = folder;
            client.commands.set(command.data.name, command);
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
}

// --- Background Task Initialization ---
const { triggerGheeDrop } = require('./utils/eventManager'); 
const config = require('./config');

client.once(Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);

    // --- Ghee Drop Event Trigger (Re-enabled & Stabilized) ---
    console.log("Setting up periodic Ghee Drop trigger...");
    setInterval(() => {
        readyClient.guilds.cache.forEach(guild => {
            // Self-contained async function to prevent unhandled promise rejections
            (async () => {
                try {
                    // 5% chance every 10 minutes to trigger the drop
                    if (Math.random() < 0.05) { 
                        await triggerGheeDrop(guild, db);
                    }
                } catch (error) {
                    console.error(`Error in Ghee Drop task for guild ${guild.id}:`, error);
                }
            })();
        });
    }, 10 * 60 * 1000);

    // --- Voice XP Granting Interval (Re-enabled & Stabilized) ---
    console.log("Setting up periodic Voice XP granting...");
    setInterval(() => {
        const promises = [];
        readyClient.voiceUsers.forEach((voiceData, userId) => {
            const userRef = db.collection('users').doc(`${voiceData.guildId}-${userId}`);
            const promise = userRef.set({
                voiceXp: FieldValue.increment(config.XP_PER_VOICE_MINUTE || 2), // Default to 2 if not in config
                spotCoins: FieldValue.increment(1) 
            }, { merge: true });
            promises.push(promise);
        });

        if (promises.length > 0) {
            Promise.all(promises)
                .catch(error => console.error("Error during batch voice XP update:", error));
        }
    }, 60 * 1000); // Grant voice XP every 1 minute
});

// --- Bot Login ---
if (!process.env.DISCORD_TOKEN) {
    console.error("DISCORD_TOKEN not found. Bot cannot start.");
    process.exit(1);
}
client.login(process.env.DISCORD_TOKEN);
