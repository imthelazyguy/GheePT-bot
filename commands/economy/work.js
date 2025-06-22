// commands/economy/work.js
const { SlashCommandBuilder } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');
const { FieldValue } = require('firebase-admin/firestore');
const config = require('../../config');

const WORK_COOLDOWN_HOURS = 1;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('work')
        .setDescription('Do some work to earn Spot Coins.'),

    async execute(interaction, db) {
        await interaction.deferReply({ ephemeral: true });

        const userRef = db.collection('users').doc(`${interaction.guild.id}-${interaction.user.id}`);
        const userDoc = await userRef.get();
        const now = new Date();
        
        if (userDoc.exists && userDoc.data().lastWorkTimestamp) {
            const lastWork = userDoc.data().lastWorkTimestamp.toDate();
            const cooldownEnd = new Date(lastWork.getTime() + WORK_COOLDOWN_HOURS * 60 * 60 * 1000);

            if (now < cooldownEnd) {
                return interaction.editReply({ embeds: [createErrorEmbed(`You're tired from your last shift. You can work again <t:${Math.floor(cooldownEnd.getTime() / 1000)}:R>.`)] });
            }
        }
        
        const earnings = Math.floor(Math.random() * 101) + 50; // Earn between 50-150 SC
        await userRef.set({
            spotCoins: FieldValue.increment(earnings),
            lastWorkTimestamp: now
        }, { merge: true });

        const embed = createSuccessEmbed('Payday!')
            .setDescription(`You worked hard as a Ghee-Spot consultant and earned **🪙 ${earnings} Spot Coins**.`);
        await interaction.editReply({ embeds: [embed] });
    },
};
