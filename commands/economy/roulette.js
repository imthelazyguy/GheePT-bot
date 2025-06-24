// commands/economy/roulette.js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    category: 'economy',
    data: new SlashCommandBuilder()
        .setName('roulette')
        .setDescription('Starts a game of multiplayer roulette in this channel.'),

    async execute(interaction) {
        // The core logic is now handled by the interactionCreate event handler
        // to manage the game state. This command just needs to trigger it.
        // We will call a function from the interactionCreate logic here.
        const { startRouletteGame } = require('../../events/interactionHandlers'); // We will create this file next
        await startRouletteGame(interaction);
    },
};
