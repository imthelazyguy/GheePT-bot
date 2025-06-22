// commands/economy/roulette.js
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createGheeEmbed, createErrorEmbed } = require('../../utils/embeds');
const { FieldValue } = require('firebase-admin/firestore');

module.exports = {
    category: 'economy',
    data: new SlashCommandBuilder()
        .setName('roulette')
        .setDescription('Place your bets at the roulette table.')
        .addIntegerOption(option =>
            option.setName('bet')
                .setDescription('The amount of Spot Coins to bet.')
                .setRequired(true)
                .setMinValue(10)),
    
    async execute(interaction, db) {
        await interaction.deferReply();
        const betAmount = interaction.options.getInteger('bet');
        const user = interaction.user;
        const userRef = db.collection('users').doc(`${interaction.guild.id}-${user.id}`);

        try {
            await db.runTransaction(async t => {
                const userDoc = await t.get(userRef);
                if (!userDoc.exists || (userDoc.data().spotCoins || 0) < betAmount) {
                    throw new Error("You don't have enough Spot Coins for that bet.");
                }
                // Preemptively deduct the bet. It will be refunded if the user doesn't complete the bet.
                t.update(userRef, { spotCoins: FieldValue.increment(-betAmount) });
            });
        } catch (error) {
            return interaction.editReply({ embeds: [createErrorEmbed(error.message)] });
        }

        const embed = createGheeEmbed('🎡 Welcome to the Roulette Table 🎡', `Your bet is **${betAmount.toLocaleString()} SC**.\n\nPlease select the **type** of bet you want to place.`)
            .setFooter({ text: 'You have 60 seconds to place your bet.' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`roulette_color_${user.id}_${betAmount}`).setLabel('Red / Black').setStyle(ButtonStyle.Secondary).setEmoji('🎨'),
            new ButtonBuilder().setCustomId(`roulette_parity_${user.id}_${betAmount}`).setLabel('Even / Odd').setStyle(ButtonStyle.Secondary).setEmoji('🔢'),
            new ButtonBuilder().setCustomId(`roulette_number_${user.id}_${betAmount}`).setLabel('Single Number').setStyle(ButtonStyle.Primary).setEmoji('🎯')
        );

        await interaction.editReply({ embeds: [embed], components: [row] });
    },
};
