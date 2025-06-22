// commands/economy/beg.js
const { SlashCommandBuilder } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');
const { FieldValue } = require('firebase-admin/firestore');

const BEG_COOLDOWN_MINUTES = 15;
const responses = [
    { message: "A kind stranger dropped {coins} SC in your cup. Don't spend it all on ghee.", success: true },
    { message: "You cried on the corner and someone gave you {coins} SC out of pity.", success: true },
    { message: "You told a sob story and GheePT gave you {coins} SC. Now get lost.", success: true },
    { message: "Get a job. You get nothing.", success: false },
    { message: "You were shooed away by a security guard. No coins for you.", success: false }
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('beg')
        .setDescription('Beg for some spare Spot Coins.'),

    async execute(interaction, db) {
        // ... (cooldown logic similar to /work, but with a 15-minute cooldown and lastBegTimestamp)
        
        const outcome = responses[Math.floor(Math.random() * responses.length)];
        if (outcome.success) {
            const earnings = Math.floor(Math.random() * 31) + 10; // Earn between 10-40 SC
            await userRef.set({ spotCoins: FieldValue.increment(earnings) /*, lastBegTimestamp: now */ }, { merge: true });
            const embed = createSuccessEmbed('Success?').setDescription(outcome.message.replace('{coins}', `**🪙 ${earnings}**`));
            await interaction.editReply({ embeds: [embed] });
        } else {
            // await userRef.set({ lastBegTimestamp: now }, { merge: true });
            const embed = createErrorEmbed('Failure.').setDescription(outcome.message);
            await interaction.editReply({ embeds: [embed] });
        }
    },
};
