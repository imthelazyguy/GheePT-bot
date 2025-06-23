// events/messageCreate.js
const { Events } = require('discord.js');
const { FieldValue } = require('firebase-admin/firestore');
const { createGheeEmbed } = require('../utils/embeds');
const { getXpForNextLevel } = require('../utils/leveling');
const config = require('../config');

// These functions remain the same for now.
async function handleCasualResponse(message, db) { /* ... existing code ... */ }

async function handleXp(message, db) {
    const guildId = message.guild.id;
    const userId = message.author.id;
    const userDocRef = db.collection('users').doc(`${guildId}-${userId}`);
    try {
        console.log(`[XP-DEBUG] Step 1: Starting XP transaction for user ${userId}.`);
        await db.runTransaction(async (transaction) => {
            console.log(`[XP-DEBUG] Step 2: Fetching user document.`);
            const userDoc = await transaction.get(userDocRef);
            const now = new Date();
            const lastMessageTime = userDoc.exists ? userDoc.data().lastMessageTimestamp?.toDate() : null;

            if (lastMessageTime && (now.getTime() - lastMessageTime.getTime()) < config.XP_COOLDOWN_SECONDS * 1000) {
                console.log(`[XP-DEBUG] User ${userId} is on XP cooldown. Aborting.`);
                return;
            }

            console.log(`[XP-DEBUG] Step 3: User is not on cooldown. Calculating XP gain.`);
            const xpGained = Math.floor(Math.random() * (config.XP_PER_MESSAGE_MAX - config.XP_PER_MESSAGE_MIN + 1)) + config.XP_PER_MESSAGE_MIN;

            const currentData = userDoc.data() || { level: 1, chatXp: 0, voiceXp: 0 };
            let { level, chatXp, voiceXp } = currentData;
            const initialLevel = level;
            
            const currentTotalXp = chatXp + voiceXp;
            const newTotalXp = currentTotalXp + xpGained;
            let xpForNext = getXpForNextLevel(level);
            console.log(`[XP-DEBUG] Step 4: User Lvl ${level} has ${currentTotalXp} XP. Needs ${xpForNext}. Gained ${xpGained}. New total: ${newTotalXp}.`);

            let leveledUp = false;
            let totalReward = 0;
            let finalRoleToGrant = null;
            
            while (newTotalXp >= xpForNext) {
                level++;
                console.log(`[XP-DEBUG] Step 5a: User leveled up to ${level}.`);
                leveledUp = true;
                totalReward += config.LEVEL_UP_REWARD_BASE * level;
                
                const roleConfigRef = db.collection('guilds').doc(guildId).collection('level_roles').doc(level.toString());
                console.log(`[XP-DEBUG] Step 5b: Checking for role at level ${level}.`);
                const roleConfigDoc = await roleConfigRef.get();
                if (roleConfigDoc.exists) {
                    finalRoleToGrant = roleConfigDoc.data();
                    console.log(`[XP-DEBUG] Step 5c: Found role ${finalRoleToGrant.roleName} for level ${level}.`);
                }
                
                xpForNext = getXpForNextLevel(level);
                console.log(`[XP-DEBUG] Step 5d: New XP threshold for next level (${level+1}) is ${xpForNext}.`);
            }

            let updateData = { chatXp: FieldValue.increment(xpGained), lastMessageTimestamp: now, username: message.author.username };

            if (leveledUp) {
                console.log(`[XP-DEBUG] Step 6: Level up confirmed. Final level: ${level}. Total reward: ${totalReward}.`);
                updateData.level = level;
                updateData.spotCoins = FieldValue.increment(totalReward);
                // ... The rest of the level up logic for sending messages ...
            }
            
            console.log(`[XP-DEBUG] Step 7: Committing transaction to database.`);
            transaction.set(userDocRef, updateData, { merge: true });
        });
        console.log(`[XP-DEBUG] Step 8: XP transaction for user ${userId} complete.`);
    } catch (error) {
        console.error(`[XP-DEBUG] XP Transaction FAILED for user ${userId}:`, error);
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
