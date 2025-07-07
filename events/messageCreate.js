// events/messageCreate.js
const { Events, ChannelType } = require('discord.js');
const { FieldValue } = require('firebase-admin/firestore');
const { getXpForLevel } = require('../utils/leveling');
const config = require('../config');

// The new, stable XP handler
async function handleXp(message, db) {
    const guildId = message.guild.id;
    const userId = message.author.id;
    const userRef = db.collection('users').doc(`${guildId}-${userId}`);

    try {
        await db.runTransaction(async (t) => {
            const doc = await t.get(userRef);
            const data = doc.exists ? doc.data() : { xp: 0, level: 0, lastXpMessage: 0 };

            const now = Date.now();
            const cooldown = (config.XP_COOLDOWN_SECONDS || 60) * 1000;
            if (now - (data.lastXpMessage || 0) < cooldown) {
                return; // User is on cooldown
            }

            const xpGained = Math.floor(Math.random() * (config.XP_PER_MESSAGE_MAX - config.XP_PER_MESSAGE_MIN + 1)) + config.XP_PER_MESSAGE_MIN;
            const newXp = (data.xp || 0) + xpGained;
            let newLevel = data.level || 0;
            let levelUp = false;

            let xpForNextLevel = getXpForLevel(newLevel);
            while (newXp >= xpForNextLevel) {
                newLevel++;
                levelUp = true;
                xpForNextLevel = getXpForLevel(newLevel);
            }

            // Update user data in the transaction
            t.set(userRef, {
                xp: newXp,
                level: newLevel,
                lastXpMessage: now,
                username: message.author.username // Keep username updated
            }, { merge: true });

            if (levelUp) {
                // Handle level up rewards outside the transaction to avoid contention
                handleLevelUp(message.member, newLevel, db);
            }
        });
    } catch (error) {
        console.error("Transaction failure in handleXp:", error);
    }
}

// This function handles giving roles and sending messages
async function handleLevelUp(member, newLevel, db) {
    const guildId = member.guild.id;
    console.log(`User ${member.user.username} has reached level ${newLevel} in guild ${guildId}`);

    // Fetch level role configurations
    const levelRolesRef = db.collection('guilds').doc(guildId).collection('level-roles');
    const snapshot = await levelRolesRef.where('level', '<=', newLevel).get();
    
    if (!snapshot.empty) {
        snapshot.forEach(doc => {
            const roleId = doc.data().roleId;
            const role = member.guild.roles.cache.get(roleId);
            if (role && !member.roles.cache.has(roleId)) {
                member.roles.add(role).catch(console.error);
            }
        });
    }
    
    // Announce the level up (optional, find a channel to send it to)
    // For example, send in a bot-log channel or the channel the message was in.
}


module.exports = {
    name: Events.MessageCreate,
    async execute(message, db) {
        if (message.author.bot || !message.guild) return;
        // Run the new, stable XP handler
        await handleXp(message, db);
        // ... your handleCasualResponse logic can go here ...
    },
};
