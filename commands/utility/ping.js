// commands/utility/ping.js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('A diagnostic command to test Discord API responsiveness.'),

    async execute(interaction) {
        console.log('[PING_DIAGNOSTIC] Step A: Command execution started.');
        try {
            console.log('[PING_DIAGNOSTIC] Step B: Attempting to send initial reply (deferReply)...');
            await interaction.deferReply({ ephemeral: true });
            console.log('[PING_DIAGNOSTIC] Step C: Initial reply was successful.');
            
            // If it gets this far, the rest is likely fine.
            await interaction.editReply({ content: 'Pong! API is responsive.' });
            console.log('[PING_DIAGNOSTIC] Step D: Final reply sent.');
        } catch (e) {
            console.error('[PING_DIAGNOSTIC] CRITICAL ERROR IN PING COMMAND:', e);
        }
    },
};
