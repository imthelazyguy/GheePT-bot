// commands/economy/slut.js
const { SlashCommandBuilder } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');
const { FieldValue } = require('firebase-admin/firestore');
const ms = require('ms');

const SLUT_COOLDOWN = ms('2h');
const responses = [
    "You worked the corner like a pro and a mysterious benefactor rewarded you with {coins} SC.",
    "Your rizz was off the charts tonight. Someone made it rain {coins} SC.",
    "Someone paid you {coins} SC to just... go away. Hey, money is money.",
];

module.exports = {
    category: 'economy',
    data: new SlashCommandBuilder()
        .setName('slut')
        .setDescription('Do what you gotta do for that bread.'),

    async execute(interaction, db) {
        await interaction.deferReply();
        const userRef = db.collection('users').doc(`${interaction.guild.id}-${interaction.user.id}`);
        const userDoc = await userRef.get();
        const now = Date.now();

        const lastSlut = userDoc.exists ? userDoc.data().lastSlutTimestamp : 0;
        const cooldownEnd = lastSlut + SLUT_COOLDOWN;
        if (now < cooldownEnd) {
            const timeLeft = ms(cooldownEnd - now, { long: true });
            return interaction.editReply({ embeds: [createErrorEmbed(`The streets need to rest. You can work it again in **${timeLeft}**.`)] });
        }
        
        const earnings = Math.floor(Math.random() * 201) + 100; // 100-300 SC
        await userRef.set({
            spotCoins: FieldValue.increment(earnings),
            lastSlutTimestamp: now
        }, { merge: true });
        
        const message = responses[Math.floor(Math.random() * responses.length)];
        const embed = createSuccessEmbed('You Got That Dough')
            .setDescription(message.replace('{coins}', `**🪙 ${earnings}**`));
        await interaction.editReply({ embeds: [embed] });
    },
};
