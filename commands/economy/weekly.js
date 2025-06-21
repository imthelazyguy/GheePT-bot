// commands/economy/weekly.js
const { SlashCommandBuilder } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');
const { FieldValue } = require('firebase-admin/firestore');
const config = require('../../config');

const COOLDOWN_DAYS = 6;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('weekly')
        .setDescription(`Claim your weekly ${config.WEEKLY_REWARD} Spot Coins!`),

    async execute(interaction, db) {
        await interaction.deferReply({ ephemeral: true });

        const guildId = interaction.guild.id;
        const userId = interaction.user.id;
        const userDocRef = db.collection('users').doc(`${guildId}-${userId}`);

        try {
            const userDoc = await userDocRef.get();
            const now = new Date();
            
            if (userDoc.exists && userDoc.data().lastWeeklyTimestamp) {
                const lastWeekly = userDoc.data().lastWeeklyTimestamp.toDate();
                const cooldownEnd = new Date(lastWeekly.getTime() + COOLDOWN_DAYS * 24 * 60 * 60 * 1000);

                if (now < cooldownEnd) {
                    const errorEmbed = createErrorEmbed(`Patience, young padawan.`)
                        .setDescription(`You've already claimed your weekly reward. You can claim it again <t:${Math.floor(cooldownEnd.getTime() / 1000)}:R>.`);
                    return interaction.editReply({ embeds: [errorEmbed] });
                }
            }
            
            await userDocRef.set({
                spotCoins: FieldValue.increment(config.WEEKLY_REWARD),
                lastWeeklyTimestamp: now
            }, { merge: true });

            const successEmbed = createSuccessEmbed('Weekly Ghee Haul!')
                .setDescription(`You received a massive **🪙 ${config.WEEKLY_REWARD} Spot Coins**! Don't spend it all in one place.`);

            await interaction.editReply({ embeds: [successEmbed] });
        } catch (error) {
            console.error(`Error processing /weekly for user ${userId}:`, error);
            await interaction.editReply({ embeds: [createErrorEmbed('Could not process your weekly reward due to a database error.')]});
        }
    },
};