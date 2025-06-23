// commands/economy/work.js
const { SlashCommandBuilder } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');
const { FieldValue } = require('firebase-admin/firestore');
const ms = require('ms');

const WORK_COOLDOWN = ms('1h');

module.exports = {
    category: 'economy',
    data: new SlashCommandBuilder()
        .setName('work')
        .setDescription('Do some work to earn Spot Coins.'),

    async execute(interaction, db) {
        await interaction.deferReply(); // FIX: Removed ephemeral: true

        const userRef = db.collection('users').doc(`${interaction.guild.id}-${interaction.user.id}`);
        const userDoc = await userRef.get();
        const now = Date.now();
        
        const lastWork = userDoc.exists ? userDoc.data().lastWorkTimestamp : 0;
        const cooldownEnd = lastWork + WORK_COOLDOWN;

        if (now < cooldownEnd) {
            const timeLeft = ms(cooldownEnd - now, { long: true });
            return interaction.editReply({ embeds: [createErrorEmbed(`You're tired from your last shift. You can work again in **${timeLeft}**.`)] });
        }
        
        const earnings = Math.floor(Math.random() * 101) + 50; // Earn between 50-150 SC
        await userRef.set({
            spotCoins: FieldValue.increment(earnings),
            lastWorkTimestamp: now
        }, { merge: true });

        const embed = createSuccessEmbed('Payday!')
            .setDescription(`${interaction.user} worked hard as a Ghee-Spot consultant and earned **🪙 ${earnings} Spot Coins**.`);
        await interaction.editReply({ embeds: [embed] });
    },
};
