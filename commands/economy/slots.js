// commands/economy/slots.js
const { SlashCommandBuilder } = require('discord.js');
const { createGheeEmbed, createErrorEmbed } = require('../../utils/embeds');
const { FieldValue } = require('firebase-admin/firestore');

const symbols = ['🍒', '🍋', '🔔', '💎', '💰', '7️⃣'];
const payouts = { '7️⃣7️⃣7️⃣': 100, '💰💰💰': 50, '💎💎💎': 25, '🔔🔔🔔': 10, '🍋🍋🍋': 5, '🍒🍒🍒': 3 };

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slots')
        .setDescription('Play the slot machine!')
        .addIntegerOption(option => option.setName('bet').setDescription('The amount of Spot Coins to bet.').setRequired(true).setMinValue(5)),

    async execute(interaction, db) {
        const betAmount = interaction.options.getInteger('bet');
        const userRef = db.collection('users').doc(`${interaction.guild.id}-${interaction.user.id}`);

        const userDoc = await userRef.get();
        if (!userDoc.exists || (userDoc.data().spotCoins || 0) < betAmount) {
            return interaction.reply({ embeds: [createErrorEmbed("You don't have enough Spot Coins for that bet.")], ephemeral: true });
        }
        await userRef.update({ spotCoins: FieldValue.increment(-betAmount) });

        const initialEmbed = createGheeEmbed('🎰 Slot Machine 🎰', `Bet: **${betAmount} SC**\n\n[ ❓ | ❓ | ❓ ]\n\n*Spinning...*`);
        await interaction.reply({ embeds: [initialEmbed] });

        // Spinning animation
        for (let i = 0; i < 3; i++) {
            await sleep(750);
            const r1 = symbols[Math.floor(Math.random() * symbols.length)];
            const r2 = symbols[Math.floor(Math.random() * symbols.length)];
            const r3 = symbols[Math.floor(Math.random() * symbols.length)];
            await interaction.editReply({ embeds: [createGheeEmbed('🎰 Slot Machine 🎰', `Bet: **${betAmount} SC**\n\n[ ${r1} | ${r2} | ${r3} ]\n\n*Spinning...*`)] });
        }
        
        // Final result
        const s1 = symbols[Math.floor(Math.random() * symbols.length)];
        const s2 = symbols[Math.floor(Math.random() * symbols.length)];
        const s3 = symbols[Math.floor(Math.random() * symbols.length)];
        const resultKey = `${s1}${s2}${s3}`;
        const payoutMultiplier = payouts[resultKey] || 0;
        const winnings = betAmount * payoutMultiplier;

        let resultText = `**[ ${s1} | ${s2} | ${s3} ]**\n\n`;
        if (winnings > 0) {
            resultText += `**JACKPOT!** You won **${winnings.toLocaleString()} SC**!`;
            await userRef.update({ spotCoins: FieldValue.increment(winnings) });
        } else {
            resultText += `No luck this time. Try again!`;
        }
        
        const finalEmbed = createGheeEmbed('🎰 Slot Machine 🎰', resultText).setColor(winnings > 0 ? 'Gold' : 'DarkGrey');
        await interaction.editReply({ embeds: [finalEmbed] });
    },
};
