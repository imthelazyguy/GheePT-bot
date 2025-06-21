// commands/fun/pp.js
const { SlashCommandBuilder } = require('discord.js');
const { createGheeEmbed } = require('../../utils/embeds');
const { OWNER_IDS } = require('../../config');

// Helper function for deterministic results based on a seed
function getSeededRandom(seed) {
    // A simple pseudo-random number generator
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pp')
        .setDescription('Measure your... potential power.')
        .addUserOption(option => option.setName('user').setDescription('The user to measure')),

    async execute(interaction) {
        await interaction.deferReply();
        const targetUser = interaction.options.getUser('user') || interaction.user;

        // Create a unique seed based on the user's ID and a 12-hour time window
        const timeSeed = Math.floor(Date.now() / (1000 * 60 * 60 * 12));
        const combinedSeed = parseInt(targetUser.id.slice(-6)) + timeSeed;

        let size;
        let responseMessage;

        // Owner Privilege: Server owners always receive the maximum score
        if (OWNER_IDS.includes(targetUser.id)) {
            size = 12;
            responseMessage = `GheePT's highly scientific measurement reveals **${targetUser.username}**'s true potential:\n\n**8${'='.repeat(size)}D**\n\n*${size} inches. Bow down, peasants (unless you're an owner, then keep shining, boss).*`;
        } else {
            size = Math.floor(getSeededRandom(combinedSeed) * 11) + 1; // Random size from 1 to 11
            responseMessage = `GheePT's highly scientific measurement for the next 12 hours reveals **${targetUser.username}**'s true potential:\n\n**8${'='.repeat(size)}D**\n\n*${size} inches. Astounding.*`;
        }
        
        const embed = createGheeEmbed('🔬 Potential Power Reading', responseMessage);
        await interaction.editReply({ embeds: [embed] });
    },
};