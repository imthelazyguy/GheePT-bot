// events/messageCreate.js
const { Events, EmbedBuilder } = require('discord.js');
const { FieldValue } = require('firebase-admin/firestore');
const { getXpForLevel } = require('../utils/leveling');
const config = require('../config');
const { getChatResponse } = require('../utils/llm');
const { summarizeText } = require('../utils/summarizer');
const { createLevelUpCard } = require('../utils/cardGenerator'); // We keep this for the level up image

// The stable handleLevelUp function from our previous working version
async function handleLevelUp(member, oldLevel, newLevel, db) {
    if (!member) return;
    try {
        // ... (The full, working handleLevelUp logic from our previous fix goes here)
    } catch (error) {
        console.error("Error in handleLevelUp:", error);
    }
}

// The stable atomic XP handler
async function handleXp(message, db) {
    const guildId = message.guild.id;
    const userId = message.author.id;
    const userRef = db.collection('users').doc(`${guildId}-${userId}`);
    let levelUpDetails = null;
    try {
        await db.runTransaction(async (t) => {
            // ... (The full, working transaction logic from our previous fix goes here)
        });
        return levelUpDetails;
    } catch (error) {
        console.error("Transaction failure in handleXp:", error);
        return null;
    }
}

// The stable auto-responder handler
async function handleCasualResponse(message, db) {
    // ... (The full, working auto-responder logic from our previous fix goes here)
}


module.exports = {
    name: Events.MessageCreate,
    async execute(message, db) {
        if (message.author.bot || !message.guild) return;

        // --- AI FEATURES (HIGHEST PRIORITY) ---

        // 1. "tl;dr" Feature
        if (message.content.toLowerCase() === 'tl;dr' && message.reference && message.reference.messageId) {
            try {
                const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
                if (repliedMessage.content) {
                    const summary = await summarizeText(repliedMessage.content);
                    await message.reply(`**tl;dr:** ${summary}`);
                }
            } catch (e) { console.error("Could not fetch message for tl;dr", e); }
            return; // Stop further processing
        }
        
        // 2. AI Chat on Mention
        if (message.mentions.has(message.client.user.id)) {
            const prevMessages = await message.channel.messages.fetch({ limit: 10 });
            const history = Array.from(prevMessages.values())
                .reverse()
                .map(msg => ({
                    role: msg.author.id === message.client.user.id ? "model" : "user",
                    parts: [{ text: `${msg.author.username}: ${msg.content}` }]
                }));

            const response = await getChatResponse(history);
            await message.reply(response);
            return; // Stop further processing
        }

        // --- EXISTING BOT FEATURES (RUN IF AI FEATURES DO NOT) ---

        // Leveling System
        const levelUpDetails = await handleXp(message, db);
        if (levelUpDetails) {
            await handleLevelUp(message.member, levelUpDetails.oldLevel, levelUpDetails.newLevel, db);
        }
        
        // Auto-Responder System
        await handleCasualResponse(message, db);
    },
};
