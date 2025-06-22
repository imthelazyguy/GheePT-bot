// events/messageCreate.js
const { Events } = require('discord.js');
const { FieldValue } = require('firebase-admin/firestore');
const { createGheeEmbed } = require('../utils/embeds');
const { getXpForNextLevel } = require('../utils/leveling');
const config = require('../config');

// This function can remain the same
async function handleCasualResponse(message, db) {
    // ... your existing code for casual responses ...
}

module.exports = {
    name: Events.MessageCreate,
    async execute(message, db) {
        if (message.author.bot || !message.guild) return;

        // --- XP and Leveling System ---
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
                
                let updateData = {
                    chatXp: FieldValue.increment(xpGained),
                    lastMessageTimestamp: now,
                    username: message.author.username
                };
                
                const currentData = userDoc.data() || { level: 1, spotCoins: 0, chatXp: 0, voiceXp: 0 };
                let { level, chatXp, voiceXp } = currentData;
                const initialLevel = level;
                
                const currentTotalXp = chatXp + voiceXp;
                const newTotalXp = currentTotalXp + xpGained;
                let xpForNext = getXpForNextLevel(level);

                let leveledUp = false;
                let totalReward = 0;
                let finalRoleToGrant = null;
                let finalRoleName = '';
                
                // --- THE FIX: Use a 'while' loop to handle multiple level-ups ---
                while (newTotalXp >= xpForNext) {
                    level++;
                    leveledUp = true;
                    totalReward += config.LEVEL_UP_REWARD_BASE * level;
                    
                    // Check if this new level has a role reward
                    const roleConfigDoc = await db.collection('guilds').doc(guildId).collection('level_roles').doc(level.toString()).get();
                    if (roleConfigDoc.exists) {
                        finalRoleToGrant = roleConfigDoc.data().roleId;
                        finalRoleName = roleConfigDoc.data().roleName;
                    }

                    // IMPORTANT: Recalculate the requirement for the *next* new level for the loop
                    xpForNext = getXpForNextLevel(level);
                }

                if (leveledUp) {
                    updateData.level = level;
                    updateData.spotCoins = FieldValue.increment(totalReward);
                    
                    const levelUpEmbed = createGheeEmbed('🎉 LEVEL UP! 🎉', `Congrats ${message.author}! You jumped from Level **${initialLevel}** to **Level ${level}**!`)
                        .addFields({ name: 'Reward', value: `You received a total of **🪙 ${totalReward} Spot Coins**!` });

                    if (finalRoleToGrant) {
                        const role = await message.guild.roles.fetch(finalRoleToGrant).catch(() => null);
                        if (role) {
                            try {
                                await message.member.roles.add(role);
                                levelUpEmbed.addFields({ name: 'Role Unlocked!', value: `You have been granted the **${finalRoleName}** role!` });
                            } catch (e) { console.error(`Failed to grant level role:`, e); }
                        }
                    }

                    // Send announcement to configured channel or the current one
                    const guildConfigDoc = await db.collection('guilds').doc(guildId).get();
                    let announcementChannel = message.channel;
                    if (guildConfigDoc.exists && guildConfigDoc.data().levelUpChannelId) {
                        const configuredChannel = await message.guild.channels.fetch(guildConfigDoc.data().levelUpChannelId).catch(() => null);
                        if (configuredChannel && configuredChannel.isTextBased()) {
                            announcementChannel = configuredChannel;
                        }
                    }
                    announcementChannel.send({ embeds: [levelUpEmbed] }).catch(e => console.error("Could not send level up message."));
                }

                transaction.set(userDocRef, updateData, { merge: true });
            });
        } catch (error) {
            console.error(`Transaction failed for user ${userId} in guild ${guildId}:`, error);
        }

        await handleCasualResponse(message, db);
    },
};
