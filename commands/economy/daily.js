// commands/economy/daily.js
const { SlashCommandBuilder } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');
const { FieldValue } = require('firebase-admin/firestore');
const config = require('../../config');

const COOLDOWN_HOURS = 22;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription(`Claim your daily ${config.DAILY_REWARD} Spot Coins!`),

    async execute(interaction, db) {
        await interaction.deferReply({ ephemeral: true });

        const guildId = interaction.guild.id;
        const userId = interaction.user.id;
        const userDocRef = db.collection('users').doc(`${guildId}-${userId}`);

        try {
            const userDoc = await userDocRef.get();
            const now = new Date();
            
            if (userDoc.exists && userDoc.data().lastDailyTimestamp) {
                const lastDaily = userDoc.data().lastDailyTimestamp.toDate();
                const cooldownEnd = new Date(lastDaily.getTime() + COOLDOWN_HOURS * 60 * 60 * 1000);

                if (now < cooldownEnd) {
                    const errorEmbed = createErrorEmbed(`You're too thirsty!`)
                        .setDescription(`You've already claimed your daily ghee. You can claim it again <t:${Math.floor(cooldownEnd.getTime() / 1000)}:R>.`);
                    return interaction.editReply({ embeds: [errorEmbed] });
                }
            }
            
            await userDocRef.set({
                spotCoins: FieldValue.increment(config.DAILY_REWARD),
                lastDailyTimestamp: now
            }, { merge: true });

            const successEmbed = createSuccessEmbed('Daily Ghee Collected!')
                .setDescription(`You received **🪙 ${config.DAILY_REWARD} Spot Coins**! Your new balance will be updated shortly.`);

            await interaction.editReply({ embeds: [successEmbed] });
        } catch (error) {
            console.error(`Error processing /daily for user ${userId}:`, error);
            await interaction.editReply({ embeds: [createErrorEmbed('Could not process your daily reward due to a database error.')]});
        }
    },
};