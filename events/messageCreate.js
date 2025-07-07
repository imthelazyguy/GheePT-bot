// events/messageCreate.js
const { Events, EmbedBuilder } = require('discord.js');
const { FieldValue } = require('firebase-admin/firestore');
const { getXpForLevel } = require('../utils/leveling');
const config = require('../config');

// This function now generates and sends a simple level up embed.
async function handleLevelUp(member, newLevel, db) {
    if (!member) return;

    console.log(`User ${member.user.username} has reached level ${newLevel}.`);
    
    const levelUpEmbed = new EmbedBuilder()
        .setColor('#00FF7F')
        .setAuthor({ name: "Level Up!", iconURL: member.user.displayAvatarURL() })
        .setDescription(`🎉 Congratulations, ${member}! You have reached **Level ${newLevel}**!`);
    
    // Find a channel to send the announcement
    const guildConfigDoc = await db.collection('guilds').doc(member.guild.id).get();
    let announcementChannel = member.guild.systemChannel;
    
    if (guildConfigDoc.exists && guildConfigDoc.data().levelUpChannelId) {
        const configuredChannel = await member.guild.channels.fetch(guildConfigDoc.data().levelUpChannelId).catch(() => null);
        if (configuredChannel && configuredChannel.isTextBased()) {
            announcementChannel = configuredChannel;
        }
    }
    
    if (announcementChannel) {
        await announcementChannel.send({ embeds: [levelUpEmbed] });
    }

    // Grant roles
    const levelRolesRef = db.collection('guilds').doc(member.guild.id).collection('level_roles');
    const rolesSnapshot = await levelRolesRef.where('level', '<=', newLevel).get();
    if (!rolesSnapshot.empty) {
        const rolesToAdd = rolesSnapshot.docs.map(doc => doc.data().roleId);
        await member.roles.add(rolesToAdd).catch(console.error);
    }
}

// The core XP handler logic (atomic transaction)
async function handleXp(message, db) {
    const guildId = message.guild.id;
    const userId = message.author.id;
    const userRef = db.collection('users').doc(`${guildId}-${userId}`);
    let levelUpDetails = null;

    try {
        await db.runTransaction(async (t) => {
            const doc = await t.get(userRef);
            const data = doc.exists ? doc.data() : { xp: 0, level: 0, lastXpMessage: 0, chatXp: 0 };
            
            const now = Date.now();
            if (now - (data.lastXpMessage || 0) < (config.XP_COOLDOWN_SECONDS || 60) * 1000) return;

            const xpGained = Math.floor(Math.random() * (config.XP_PER_MESSAGE_MAX - config.XP_PER_MESSAGE_MIN + 1)) + config.XP_PER_MESSAGE_MIN;
            const newTotalXp = (data.xp || 0) + xpGained;
            const newChatXp = (data.chatXp || 0) + xpGained;
            const initialLevel = data.level || 0;
            let newLevel = initialLevel;
            
            let xpForNextLevel = getXpForLevel(newLevel);
            while (newTotalXp >= xpForNextLevel) {
                newLevel++;
                xpForNextLevel = getXpForLevel(newLevel);
            }

            const updateData = { xp: newTotalXp, chatXp: newChatXp, level: newLevel, lastXpMessage: now, username: message.author.username };
            t.set(userRef, updateData, { merge: true });

            if (newLevel > initialLevel) {
                levelUpDetails = { newLevel };
            }
        });
        return levelUpDetails;
    } catch (error) {
        console.error("Transaction failure in handleXp:", error);
        return null;
    }
}


module.exports = {
    name: Events.MessageCreate,
    async execute(message, db) {
        if (message.author.bot || !message.guild) return;

        const levelUpDetails = await handleXp(message, db);
        if (levelUpDetails) {
            await handleLevelUp(message.member, levelUpDetails.newLevel, db);
        }
        
        // ... casual response logic ...
    },
};
