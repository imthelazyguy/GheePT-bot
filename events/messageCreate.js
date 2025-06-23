// events/messageCreate.js
const { Events } = require('discord.js');
const { FieldValue } = require('firebase-admin/firestore');
const { createGheeEmbed } = require('../utils/embeds');
const { getXpForNextLevel } = require('../utils/leveling');
const config = require('../config');

// handleCasualResponse function remains the same
async function handleCasualResponse(message, db) { /* ... existing code ... */ }

async function handleXp(message, db) {
    const guildId = message.guild.id;
    const userId = message.author.id;
    const userDocRef = db.collection('users').doc(`${guildId}-${userId}`);
    try {
        await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
            const now = new Date();
            const lastMessageTime = userDoc.exists ? userDoc.data().lastMessageTimestamp?.toDate() : null;

            if (lastMessageTime && (now.getTime() - lastMessageTime.getTime()) < config.XP_COOLDOWN_SECONDS * 1000) {
                return;
            }
            const xpGained = Math.floor(Math.random() * (config.XP_PER_MESSAGE_MAX - config.XP_PER_MESSAGE_MIN + 1)) + config.XP_PER_MESSAGE_MIN;

            // =================================================================
            // --- THE DEFINITIVE DATA RESILIENCY FIX ---
            // Instead of destructuring directly, we get the data object and then
            // manually assign each variable with a default fallback value.
            // This ensures 'level' can never be undefined and will never produce NaN.
            // =================================================================
            const currentData = userDoc.data() || {}; // Start with an empty object if no data
            let level = currentData.level || 1;
            let chatXp = currentData.chatXp || 0;
            let voiceXp = currentData.voiceXp || 0;
            const initialLevel = level;

            const currentTotalXp = chatXp + voiceXp;
            const newTotalXp = currentTotalXp + xpGained;
            let xpForNext = getXpForNextLevel(level);
            
            let leveledUp = false;
            let totalReward = 0;
            let finalRoleToGrant = null;
            
            while (newTotalXp >= xpForNext) {
                level++;
                leveledUp = true;
                totalReward += config.LEVEL_UP_REWARD_BASE * level;
                const roleConfigDoc = await db.collection('guilds').doc(guildId).collection('level_roles').doc(level.toString()).get();
                if (roleConfigDoc.exists) {
                    finalRoleToGrant = roleConfigDoc.data();
                }
                xpForNext = getXpForNextLevel(level);
            }

            let updateData = { chatXp: FieldValue.increment(xpGained), lastMessageTimestamp: now, username: message.author.username };

            if (leveledUp) {
                updateData.level = level;
                updateData.spotCoins = FieldValue.increment(totalReward);
                // ... The rest of the level up message logic remains the same ...
            }
            transaction.set(userDocRef, updateData, { merge: true });
        });
    } catch (error) {
        console.error(`XP Transaction failed for user ${userId}:`, error);
    }
}

module.exports = {
    name: Events.MessageCreate,
    async execute(message, db) {
        if (message.author.bot || !message.guild) return;
        await handleCasualResponse(message, db);
        await handleXp(message, db);
    },
};
