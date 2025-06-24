// commands/economy/roulette.js
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { createErrorEmbed } = require('../../utils/embeds');

module.exports = {
    category: 'economy',
    data: new SlashCommandBuilder()
        .setName('roulette')
        .setDescription('Starts a multiplayer game of roulette.'),

    async execute(interaction, db) {
        const channelId = interaction.channel.id;
        // Access the global memory from the client object
        if (interaction.client.activeRouletteGames.has(channelId)) {
            return interaction.reply({ embeds: [createErrorEmbed("A roulette game is already in progress in this channel!")], ephemeral: true });
        }

        const gameId = `roulette_${channelId}`;
        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🎡 A Roulette Game Has Started! 🎡')
            .setDescription('The table is open for bets for the next **60 seconds**!\n\nClick "Place Bet" to join the fun.')
            .addFields({ name: 'Players & Bets', value: 'No bets placed yet.' })
            .setFooter({ text: 'The wheel will spin in 60 seconds.' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`${gameId}_join`).setLabel('Place Bet').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`${gameId}_spin`).setLabel('Spin Now (Host)').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId(`${gameId}_cancel`).setLabel('Cancel (Host)').setStyle(ButtonStyle.Danger)
        );

        const message = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

        const game = {
            hostId: interaction.user.id,
            players: new Map(),
            state: 'betting',
            message: message,
            db: db,
            timeout: setTimeout(() => {
                // We need to pass the client object to the spin function
                const { spinWheel } = require('../../events/interactionHandlers');
                spinWheel(interaction.client, channelId);
            }, 60 * 1000),
        };
        
        // Save the game to the central client memory
        interaction.client.activeRouletteGames.set(channelId, game);
    },
};
