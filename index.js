const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, REST, Routes } = require('discord.js');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
require('dotenv').config();

// --- BOT CLIENT SETUP ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent
    ]
});

// --- DATABASE CONNECTION ---
try {
    const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_PRIVATE_KEY_BASE64, 'base64').toString('utf8'));
    initializeApp({ credential: cert(serviceAccount) });
    console.log("Successfully connected to Firestore.");
} catch (error) {
    console.error("Failed to connect to Firestore:", error);
    process.exit(1);
}
const db = getFirestore();

// --- DYNAMIC COMMAND & EVENT HANDLING ---
client.commands = new Collection();
client.greetingKeywords = new Map();
client.greetingCooldowns = new Collection();

const loadHandlers = (dirName) => {
    const fullPath = path.join(__dirname, dirName);
    const files = fs.readdirSync(fullPath).filter(file => file.endsWith('.js'));
    for (const file of files) {
        const filePath = path.join(fullPath, file);
        const handler = require(filePath);
        if (dirName === 'commands') {
            client.commands.set(handler.data.name, handler);
        } else if (dirName === 'events' && handler.name && handler.execute) {
            if (handler.once) {
                client.once(handler.name, (...args) => handler.execute(...args, db));
            } else {
                client.on(handler.name, (...args) => handler.execute(...args, db));
            }
        }
    }
};

const commandFolders = fs.readdirSync(path.join(__dirname, 'commands'));
for (const folder of commandFolders) {
    loadHandlers(path.join('commands', folder));
}
loadHandlers('events');
console.log("Successfully loaded all commands and events.");


// --- SELF-DEPLOYING COMMANDS LOGIC ---
(async () => {
    const commands = [];
    client.commands.forEach(command => {
        commands.push(command.data.toJSON());
    });

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);
        const data = await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands },
        );
        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error("Failed to refresh commands:", error);
    }

    // --- BOT LOGIN ---
    client.login(process.env.DISCORD_TOKEN);
})();
