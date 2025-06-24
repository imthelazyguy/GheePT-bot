// events/interactionHandlers.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed, createGheeEmbed } = require('../utils/embeds');
const { FieldValue } = require('firebase-admin/firestore');
const Roulette = require('../utils/roulette');
const db = require('../firebase'); // Assuming you have a central firebase export

const activeRouletteGames = new Map();

// This function is called by the /roulette command
async function startRouletteGame(interaction) {
    const channelId = interaction.channel.id;
    if (activeRouletteGames.has(channelId)) {
        return interaction.reply({ embeds: [createErrorEmbed("A roulette game is already in progress in this channel. Join it!")], ephemeral: true });
    }

    const gameId = `roulette_${channelId}_${Date.now()}`;
    const game = {
        hostId: interaction.user.id,
        channelId: channelId,
        players: new Map(),
        state: 'betting',
        messageId: null,
        timeout: null,
    };

    const embed = createGheeEmbed('🎡 A New Roulette Game Has Started! 🎡', 'The table is open for bets for the next 60 seconds!\n\nClick "Place Bet" to join the fun.')
        .setFooter({ text: 'Bets will close automatically in 60 seconds.' });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`${gameId}_join`).setLabel('Place Bet').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`${gameId}_spin`).setLabel('Spin Now').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`${gameId}_cancel`).setLabel('Cancel Game').setStyle(ButtonStyle.Danger)
    );

    const message = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
    game.messageId = message.id;

    // Set a timeout to automatically spin the wheel
    game.timeout = setTimeout(() => spinTheWheel(interaction.client, channelId), 60 * 1000);

    activeRouletteGames.set(channelId, game);
}

// All other interaction logic will go here
// We'll need handlers for the buttons: join, spin, cancel, and the betting modals

// ... More handlers to be added

module.exports = {
    startRouletteGame,
    // other exported handlers
};
