// events/messageCreate.js
const { Events, EmbedBuilder } = require('discord.js');
const { FieldValue } = require('firebase-admin/firestore');
const { getXpForLevel } = require('../utils/leveling');
const { createLevelUpCard } = require('../utils/cardGenerator');
const config = require('../config');

// This function handles giving roles and sending the level-up card
async function handleLevelUp(member, oldLevel, newLevel, db) {
    if (!member) return;
    const guildId = member.guild.id;
    const userId = member.user.id;
    console.log(`User ${member.user.username} leveled up from ${oldLevel} to ${newLevel}.`);
    
    try {
        const userRef = db.collection('users').doc(`${guildId}-${userId}`);
        // Fetch current user's total XP and calculate their rank
        const userDoc = await userRef.get();
        if (!userDoc.exists) return;

        const totalXp = userDoc.data().xp || 0;
        
        const rankSnapshot = await db.collection('users').where('xp', '>', totalXp).count().get();
        const rank = rankSnapshot.data().count + 1;

        // Generate the level up card image
        const imageUrl = await createLevelUpCard(member, oldLevel, newLevel, totalXp, rank);
        if (!imageUrl) throw new Error("Image generation failed.");

        const levelUpEmbed = new EmbedBuilder()
            .setColor('#00FF7F')
            .setImage(imageUrl);
        
        // Find the correct channel to announce the level up
        const guildConfigDoc = await db.collection('guilds').doc(guildId).get();
        let announcementChannel = member.guild.systemChannel; // Default to system channel
        
        if (guildConfigDoc.exists && guildConfigDoc.data().levelUpChannelId) {
            const configuredChannel = await member.guild.channels.fetch(guildConfigDoc.data().levelUpChannelId).catch(() => null);
            if (configuredChannel && configuredChannel.isTextBased()) {
                announcementChannel = configuredChannel;
            }
        }
        
        if (announcementChannel) {
            await announcementChannel.send({ content: `🎉 **LEVEL UP!** | Congratulations ${member}!`, embeds: [levelUpEmbed] });
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

// The atomic XP handler
async function handleXp(message, db) {
    const guildId = message.guild.id;
    const userId = message.author.id;
    const userRef = db.collection('users').doc(`${guildId}-${userId}`);
    let levelUpDetails = null;

    try {
        await db.runTransaction(async (t) => {
            const doc = await t.get(userRef);
            const data = doc.exists ? doc.data() : { xp: 0, level: 0, lastXpMessage: 0 };

            const now = Date.now();
            const cooldown = (config.XP_COOLDOWN_SECONDS || 60) * 1000;
            if (now - (data.lastXpMessage || 0) < cooldown) return;

            const xpGained = Math.floor(Math.random() * (config.XP_PER_MESSAGE_MAX - config.XP_PER_MESSAGE_MIN + 1)) + config.XP_PER_MESSAGE_MIN;
            const newXp = (data.xp || 0) + xpGained;
            const initialLevel = data.level || 0;
            let newLevel = initialLevel;
            
            // FIX: The 'leveledUp' variable is now correctly defined here
            let leveledUp = false;
            let xpForNextLevel = getXpForLevel(newLevel);

            while (newXp >= xpForNextLevel) {
                newLevel++;
                leveledUp = true;
                xpForNextLevel = getXpForLevel(newLevel);
            }

            const updateData = { xp: newXp, level: newLevel, lastXpMessage: now, username: message.author.username };
            t.set(userRef, updateData, { merge: true });

            if (leveledUp) {
                // Store the level up info to be handled outside the transaction
                levelUpDetails = { oldLevel: initialLevel, newLevel: newLevel };
            }
        });

        // Return the details if a level up occurred
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

        // The execute function now correctly checks for level-up details
        const levelUpDetails = await handleXp(message, db);
        if (levelUpDetails) {
            await handleLevelUp(message.member, levelUpDetails.oldLevel, levelUpDetails.newLevel, db);
        }
        
        // ... your handleCasualResponse logic can go here if you have it ...
    },
};
