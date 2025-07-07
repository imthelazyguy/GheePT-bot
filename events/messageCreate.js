// events/messageCreate.js
const { Events } = require('discord.js');
const { FieldValue } = require('firebase-admin/firestore');
const { createGheeEmbed } = require('../utils/embeds');
const { getXpForNextLevel } = require('../utils/leveling');
const config = require('../config');

// This function now contains the improved logic for checking all trigger types.
async function handleCasualResponse(message, db) {
    const guildId = message.guild.id;
    const client = message.client;
    const cooldowns = client.greetingCooldowns;
    const now = Date.now();
    const GREETING_COOLDOWN_SECONDS = 30;

    // Exit if channel is on cooldown
    if (cooldowns.has(message.channel.id) && (now - cooldowns.get(message.channel.id)) < GREETING_COOLDOWN_SECONDS * 1000) {
        return;
    }

    // Load triggers from cache or Firestore
    if (!client.greetingKeywords.has(guildId)) {
        const snapshot = await db.collection('guilds').doc(guildId).collection('greetings').get();
        client.greetingKeywords.set(guildId, snapshot.docs.map(doc => doc.data()));
        // Auto-refresh cache every 5 minutes
        setTimeout(() => client.greetingKeywords.delete(guildId), 5 * 60 * 1000);
    }

    const triggers = client.greetingKeywords.get(guildId);
    if (!triggers || triggers.length === 0) return;

    const messageContent = message.content.toLowerCase();
    let matchedTrigger = null;

    // 1. Check for Bot Mention Trigger
    if (message.mentions.has(client.user.id)) {
        matchedTrigger = triggers.find(t => t.triggerType === 'mention');
    }

    // 2. If no match, check for Keyword Triggers
    if (!matchedTrigger) {
        for (const trigger of triggers) {
            if (trigger.triggerType !== 'keyword' || !trigger.triggerContent) continue;
            
            const keyword = trigger.triggerContent; // Already stored in lowercase
            let matchFound = false;

            if (trigger.matchExact) {
                if (messageContent === keyword) matchFound = true;
            } else {
                // Use a regex to match whole words only, case-insensitively
                const regex = new RegExp(`\\b${keyword}\\b`, 'i');
                if (regex.test(message.content)) matchFound = true;
            }

            if (matchFound) {
                matchedTrigger = trigger;
                break;
            }
        }
    }

    // 3. If a trigger was matched, send a reply
    if (matchedTrigger && matchedTrigger.replies && matchedTrigger.replies.length > 0) {
        const reply = matchedTrigger.replies[Math.floor(Math.random() * matchedTrigger.replies.length)];
        await message.channel.send(reply).catch(console.error);
        cooldowns.set(message.channel.id, now);
    }
}


// Your handleXp function remains the same.
async function handleXp(message, db) {
    // ... complete, working XP logic from our previous fix ...
}


module.exports = {
    name: Events.MessageCreate,
    async execute(message, db) {
        if (message.author.bot || !message.guild) return;

        // Run both systems independently to ensure both can trigger
        await handleXp(message, db);
        await handleCasualResponse(message, db);
    },
};
