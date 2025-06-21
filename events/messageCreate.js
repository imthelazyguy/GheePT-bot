// events/messageCreate.js
const { Events } = require('discord.js');
const { FieldValue } = require('firebase-admin/firestore');
const { createGheeEmbed } = require('../utils/embeds');
const { getXpForNextLevel } = require('../utils/leveling');
const config = require('../config');

async function handleCasualResponse(message, db) { /* ... existing function ... */ }

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

                const currentData = userDoc.data() || { level: 1, spotCoins: 0, chatXp: 0, voiceXp: 0 };
                let { level, chatXp, voiceXp } = currentData;

                const totalXp = chatXp + voiceXp;
                const xpForNext = getXpForNextLevel(level);
                
                let updateData = {
                    chatXp: FieldValue.increment(xpGained),
                    lastMessageTimestamp: now,
                    username: message.author.username
                };

                if ((totalXp + xpGained) >= xpForNext) {
                    level += 1;
                    const reward = config.LEVEL_UP_REWARD_BASE * level;
                    
                    updateData.level = level;
                    updateData.spotCoins = FieldValue.increment(reward);

                    const levelUpEmbed = createGheeEmbed('🎉 LEVEL UP! 🎉', `Congrats ${message.author}! You just became a Level **${level}** Ghee Fiend!`)
                        .addFields({ name: 'Reward', value: `You received **🪙 ${reward} Spot Coins**!` });
                    
                    const roleConfigRef = db.collection('guilds').doc(guildId).collection('level_roles').doc(level.toString());
                    const roleConfigDoc = await roleConfigRef.get();
                    if (roleConfigDoc.exists) {
                        const roleId = roleConfigDoc.data().roleId;
                        const roleToGrant = await message.guild.roles.fetch(roleId).catch(() => null);
                        if (roleToGrant) {
                            try {
                                await message.member.roles.add(roleToGrant);
                                levelUpEmbed.addFields({ name: 'Role Unlocked!', value: `You have been granted the ${roleToGrant} role!` });
                            } catch (e) {
                                console.error(`Failed to grant level role ${roleToGrant.name} to ${message.author.tag}:`, e);
                            }
                        }
                    }

                    // --- NEW: Send to a specific channel if configured ---
                    const guildConfigRef = db.collection('guilds').doc(guildId);
                    const guildConfigDoc = await guildConfigRef.get();
                    let announcementChannel = message.channel; // Default to current channel

                    if (guildConfigDoc.exists && guildConfigDoc.data().levelUpChannelId) {
                        const configuredChannel = await message.guild.channels.fetch(guildConfigDoc.data().levelUpChannelId).catch(() => null);
                        if (configuredChannel && configuredChannel.isTextBased()) {
                            announcementChannel = configuredChannel;
                        }
                    }
                    
                    announcementChannel.send({ embeds: [levelUpEmbed] }).catch(e => console.error(`Could not send level up message to channel ${announcementChannel.id}.`));
                }
                transaction.set(userDocRef, updateData, { merge: true });
            });
        } catch (error) {
            console.error(`Transaction failed for user ${userId} in guild ${guildId}:`, error);
        }

        // --- Casual Response System ---
        await handleCasualResponse(message, db);
    },
};