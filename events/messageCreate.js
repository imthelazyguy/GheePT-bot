// events/messageCreate.js
const { Events } = require('discord.js');
const { FieldValue } = require('firebase-admin/firestore');
const { createGheeEmbed } = require('../utils/embeds');
const { getXpForNextLevel } = require('../utils/leveling');
const config = require('../config');

async function handleCasualResponse(message, db) {
    const guildId = message.guild.id;
    const client = message.client;
    const GREETING_COOLDOWN_SECONDS = 300; // 5 minutes

    const cooldowns = client.greetingCooldowns;
    const now = Date.now();
    const lastResponse = cooldowns.get(message.channel.id);
    if (lastResponse && (now - lastResponse) < GREETING_COOLDOWN_SECONDS * 1000) return;

    if (!client.greetingKeywords.has(guildId)) {
        const snapshot = await db.collection('guilds').doc(guildId).collection('greetings').get();
        const keywords = new Map();
        snapshot.forEach(doc => keywords.set(doc.id, doc.data().replies));
        client.greetingKeywords.set(guildId, keywords);
    }

    const keywordsMap = client.greetingKeywords.get(guildId);
    if (!keywordsMap || keywordsMap.size === 0) return;
    
    for (const [keyword, replies] of keywordsMap.entries()) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        if (regex.test(message.content)) {
            if (replies && replies.length > 0) {
                const reply = replies[Math.floor(Math.random() * replies.length)];
                await message.channel.send(reply).catch(console.error);
                cooldowns.set(message.channel.id, now);
                return;
            }
        }
    }
}

async function handleXp(message, db) {
    const guildId = message.guild.id;
    const userId = message.author.id;
    const userDocRef = db.collection('users').doc(`${guildId}-${userId}`);
    try {
        await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
            const now = new Date();
            const lastMessageTime = userDoc.exists ? userDoc.data().lastMessageTimestamp?.toDate() : null;
            if (lastMessageTime && (now.getTime() - lastMessageTime.getTime()) < config.XP_COOLDOWN_SECONDS * 1000) return;
            
            const xpGained = Math.floor(Math.random() * (config.XP_PER_MESSAGE_MAX - config.XP_PER_MESSAGE_MIN + 1)) + config.XP_PER_MESSAGE_MIN;
            
            const currentData = userDoc.data() || { level: 1, chatXp: 0, voiceXp: 0, spotCoins: 0 };
            let { level, chatXp, voiceXp } = currentData;
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
                totalReward += (config.LEVEL_UP_REWARD_BASE || 100) * level;
                const roleConfigDoc = await db.collection('guilds').doc(guildId).collection('level_roles').doc(level.toString()).get();
                if (roleConfigDoc.exists) finalRoleToGrant = roleConfigDoc.data();
                xpForNext = getXpForNextLevel(level);
            }

            let updateData = { chatXp: FieldValue.increment(xpGained), lastMessageTimestamp: now, username: message.author.username };
            if (leveledUp) {
                updateData.level = level;
                updateData.spotCoins = FieldValue.increment(totalReward);
                const levelUpEmbed = createGheeEmbed('🎉 LEVEL UP! 🎉', `Congrats ${message.author}! You jumped from Level **${initialLevel}** to **Level ${level}**!`)
                    .addFields({ name: 'Reward', value: `You received a total of **🪙 ${totalReward} Spot Coins**!` });
                if (finalRoleToGrant) {
                    const role = await message.guild.roles.fetch(finalRoleToGrant.roleId).catch(() => null);
                    if (role) {
                        await message.member.roles.add(role).catch(e => console.error(`Failed to grant level role:`, e));
                        levelUpEmbed.addFields({ name: 'Role Unlocked!', value: `You have been granted the **${role.name}** role!` });
                    }
                }
                const guildConfigDoc = await db.collection('guilds').doc(guildId).get();
                let announcementChannel = message.channel;
                if (guildConfigDoc.exists && guildConfigDoc.data().levelUpChannelId) {
                    const configuredChannel = await message.guild.channels.fetch(guildConfigDoc.data().levelUpChannelId).catch(() => null);
                    if (configuredChannel && configuredChannel.isTextBased()) announcementChannel = configuredChannel;
                }
                announcementChannel.send({ embeds: [levelUpEmbed] }).catch(console.error);
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
        await handleXp(message, db);
        await handleCasualResponse(message, db);
    },
};
