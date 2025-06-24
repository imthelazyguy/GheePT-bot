// commands/economy/roulette.js
const { SlashCommandBuilder } = require('discord.js');
const { startRouletteGame } = require('../../utils/rouletteManager');

module.exports = {
    category: 'economy',
    data: new SlashCommandBuilder()
        .setName('roulette')
        .setDescription('Starts a multiplayer game of roulette in this channel.'),

    async execute(interaction, db) {
        // The new manager handles everything
        await startRouletteGame(interaction, db);
    },
};
