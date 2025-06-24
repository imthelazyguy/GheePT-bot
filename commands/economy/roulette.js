// commands/economy/roulette.js
const { SlashCommandBuilder } = require('discord.js');
const { startRouletteGame } = require('../../utils/rouletteManager'); // We will create this new manager file

module.exports = {
    category: 'economy',
    data: new SlashCommandBuilder()
        .setName('roulette')
        .setDescription('Starts a multiplayer game of roulette.'),

    async execute(interaction, db) {
        await startRouletteGame(interaction, db);
    },
};
