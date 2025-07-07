// events/messageCreate.js
const { Events, EmbedBuilder } = require('discord.js');
const { FieldValue } = require('firebase-admin/firestore');
const { getXpForLevel } = require('../utils/leveling');
const { createLevelUpCard } = require('../utils/cardGenerator'); // <-- NEW
const config = require('../config');

// This function now generates and sends the level up image card
async function handleLevelUp(member, oldLevel, newLevel, db) {
    const guildId = member.guild.id;
    const userId = member.user.id;
    console.log(`User ${member.user.username} leveled up from ${oldLevel} to ${newLevel}.`);
    
    try {
        const userRef = db.collection('users').doc(`${guildId}-${userId}`);
        const usersInGuildRef = db.collection('users');

        // Get current user's total XP and calculate their rank
        const userDoc = await userRef.get();
        const totalXp = (userDoc.data().chatXp || 0) + (userDoc.data().voiceXp || 0);
        
        const rankSnapshot = await usersInGuildRef.where('xp', '>', totalXp).count().get();
        const rank = rankSnapshot.data().count + 1;

        // Generate the level up card image
        const imageUrl = await createLevelUpCard(member, oldLevel, newLevel, totalXp, rank);
        if (!imageUrl) throw new Error("Image generation failed.");

        const levelUpEmbed = new EmbedBuilder()
            .setColor('#00FF7F')
            .setTitle(`🎉 Congrats, ${member.user.username}! 🎉`)
            .setImage(imageUrl)
            .setDescription(`${member.user} has reached **Level ${newLevel}**!`);
        
        // Announce the level up
        const guildConfigDoc = await db.collection('guilds').doc(guildId).get();
        let announcementChannel = member.guild.channels.cache.get(member.lastMessageChannelId) || member.guild.systemChannel;
        
        if (guildConfigDoc.exists && guildConfigDoc.data().levelUpChannelId) {
            const configuredChannel = await member.guild.channels.fetch(guildConfigDoc.data().levelUpChannelId).catch(() => null);
            if (configuredChannel && configuredChannel.isTextBased()) {
                announcementChannel = configuredChannel;
            }
        }
        
        if (announcementChannel) {
            await announcementChannel.send({ embeds: [levelUpEmbed] });
        }

        // Grant roles for ALL levels up to the new one
        const levelRolesRef = db.collection('guilds').doc(guildId).collection('level_roles');
        const rolesSnapshot = await levelRolesRef.where('level', '<=', newLevel).get();
        if (!rolesSnapshot.empty) {
            const rolesToAdd = rolesSnapshot.docs.map(doc => doc.data().roleId);
            await member.roles.add(rolesToAdd).catch(console.error);
        }

    } catch (error) {
        console.error("Error in handleLevelUp:", error);
    }
}

// The XP handler now calls the new level up handler
async function handleXp(message, db) {
    // ... (This function's internal logic remains mostly the same) ...
    // The key change is inside the 'if (leveledUp)' block:
    if (leveledUp) {
        updateData.level = level;
        updateData.spotCoins = FieldValue.increment(totalReward);
        // We now call the dedicated handler function AFTER the transaction
        transaction.set(userDocRef, updateData, { merge: true });
        // Set a flag to call the handler after the transaction succeeds
        transaction._levelUpDetails = { oldLevel: initialLevel, newLevel: level };
    } else {
        transaction.set(userDocRef, updateData, { merge: true });
    }
}

module.exports = {
    name: Events.MessageCreate,
    async execute(message, db) {
        if (message.author.bot || !message.guild) return;

        // We slightly modify the execute logic to handle the post-transaction level up
        const levelUpDetails = await handleXp(message, db);
        if (levelUpDetails) {
            await handleLevelUp(message.member, levelUpDetails.oldLevel, levelUpDetails.newLevel, db);
        }
        
        // ... your handleCasualResponse logic ...
    },
};
