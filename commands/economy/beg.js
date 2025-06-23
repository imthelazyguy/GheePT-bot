// commands/economy/beg.js
const { SlashCommandBuilder } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');
const { FieldValue } = require('firebase-admin/firestore');
const ms = require('ms');

const BEG_COOLDOWN = ms('15m');
const successResponses = [
    "A kind stranger dropped {coins} SC in {user}'s cup. Don't spend it all on ghee.",
    "{user} cried on the corner and someone gave them {coins} SC out of pity.",
    "{user} told a sob story and GheePT gave them {coins} SC. Now get lost.",
];
const failResponses = [
    "Get a job, {user}. You get nothing.",
    "{user} was shooed away by a security guard. No coins for you.",
    "Someone threw a rock at {user}. Ouch.",
];

module.exports = {
    category: 'economy',
    data: new SlashCommandBuilder()
        .setName('beg')
        .setDescription('Beg for some spare Spot Coins.'),

    async execute(interaction, db) {
        await interaction.deferReply(); // FIX: Removed ephemeral: true
        const userRef = db.collection('users').doc(`${interaction.guild.id}-${interaction.user.id}`);
        const userDoc = await userRef.get();
        const now = Date.now();

        const lastBeg = userDoc.exists ? userDoc.data().lastBegTimestamp : 0;
        const cooldownEnd = lastBeg + BEG_COOLDOWN;
        if (now < cooldownEnd) {
            const timeLeft = ms(cooldownEnd - now, { long: true });
            return interaction.editReply({ embeds: [createErrorEmbed(`People are tired of your sob stories. Come back in **${timeLeft}**.`)] });
        }
        
        await userRef.set({ lastBegTimestamp: now }, { merge: true });

        if (Math.random() < 0.6) { // 60% chance of success
            const earnings = Math.floor(Math.random() * 31) + 10; // 10-40 SC
            await userRef.update({ spotCoins: FieldValue.increment(earnings) });
            const message = successResponses[Math.floor(Math.random() * successResponses.length)];
            const embed = createSuccessEmbed('Success?').setDescription(message.replace('{coins}', `**🪙 ${earnings}**`).replace('{user}', `${interaction.user}`));
            await interaction.editReply({ embeds: [embed] });
        } else {
            const message = failResponses[Math.floor(Math.random() * failResponses.length)];
            const embed = createErrorEmbed('Failure.').setDescription(message.replace('{user}', `${interaction.user}`));
            await interaction.editReply({ embeds: [embed] });
        }
    },
};
