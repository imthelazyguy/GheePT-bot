// commands/economy/coinflip.js
const { SlashCommandBuilder } = require('discord.js');
const { createGheeEmbed, createErrorEmbed } = require('../../utils/embeds');
const { FieldValue } = require('firebase-admin/firestore');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('coinflip')
        .setDescription('Flip a coin and double your bet, or lose it all.')
        .addIntegerOption(option => option.setName('bet').setDescription('The amount of Spot Coins to bet.').setRequired(true).setMinValue(1))
        .addStringOption(option =>
            option.setName('choice')
                .setDescription('Your choice.')
                .setRequired(true)
                .addChoices(
                    { name: '🪙 Heads', value: 'heads' },
                    { name: '👑 Tails', value: 'tails' }
                )),
    async execute(interaction, db) {
        await interaction.deferReply();
        const betAmount = interaction.options.getInteger('bet');
        const choice = interaction.options.getString('choice');
        const userRef = db.collection('users').doc(`${interaction.guild.id}-${interaction.user.id}`);

        try {
            await db.runTransaction(async t => {
                const userDoc = await t.get(userRef);
                if (!userDoc.exists || (userDoc.data().spotCoins || 0) < betAmount) {
                    throw new Error("You don't have enough Spot Coins for that bet.");
                }

                const result = Math.random() < 0.5 ? 'heads' : 'tails';
                const win = result === choice;
                const payout = win ? betAmount : -betAmount;
                
                t.update(userRef, { spotCoins: FieldValue.increment(payout) });

                const resultEmoji = result === 'heads' ? '🪙' : '👑';
                const embed = createGheeEmbed(`🪙 Coin Flip Results 👑`, `The coin landed on **${result.toUpperCase()}** ${resultEmoji}!`)
                    .addFields({ name: 'Outcome', value: win ? `You won **${betAmount.toLocaleString()} SC**!` : `You lost **${betAmount.toLocaleString()} SC**. Oof.` })
                    .setColor(win ? 'Green' : 'Red');
                
                await interaction.editReply({ embeds: [embed] });
            });
        } catch (error) {
            await interaction.editReply({ embeds: [createErrorEmbed(error.message || "The transaction failed.")] });
        }
    },
};
