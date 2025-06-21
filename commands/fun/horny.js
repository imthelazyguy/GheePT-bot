// commands/fun/horny.js
const { SlashCommandBuilder } = require('discord.js');
const { createGheeEmbed } = require('../../utils/embeds');

function getSeededRandom(seed) {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('horny')
        .setDescription('Check the Arousometer reading.')
        .addUserOption(option => option.setName('user').setDescription('The user to scan')),

    async execute(interaction) {
        await interaction.deferReply();
        const targetUser = interaction.options.getUser('user') || interaction.user;

        const timeSeed = Math.floor(Date.now() / (1000 * 60 * 60 * 12));
        const combinedSeed = parseInt(targetUser.id.slice(-4)) + timeSeed;

        const percentage = Math.floor(getSeededRandom(combinedSeed) * 101);
        
        const responseMessage = `GheePT's 'Arousometer' just exploded. **${targetUser.username}**'s horny levels are at **${percentage}%** for the next 12 hours. Please find a chill pill or a private channel.`; // 

        const embed = createGheeEmbed('🥵 Arousometer', responseMessage);
        await interaction.editReply({ embeds: [embed] });
    },
};