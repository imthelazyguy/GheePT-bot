// commands/utility/debug-ping.js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('debug-ping')
        .setDescription('A simple command for debugging interaction responses.'),

    async execute(interaction) {
        console.log('[DEBUG] /debug-ping: Command initiated.');
        await interaction.reply({ content: 'Pong!', ephemeral: true });
        console.log('[DEBUG] /debug-ping: Reply sent successfully.');
    },
};
