// commands/fun/gay.js
const { SlashCommandBuilder } = require('discord.js');
const { createGheeEmbed } = require('../../utils/embeds');

function getSeededRandom(seed) {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gay')
        .setDescription('How fabulous are you feeling today?')
        .addUserOption(option => option.setName('user').setDescription('The user to rate')),

    async execute(interaction) {
        await interaction.deferReply();
        const targetUser = interaction.options.getUser('user') || interaction.user;

        const timeSeed = Math.floor(Date.now() / (1000 * 60 * 60 * 12));
        const combinedSeed = parseInt(targetUser.id.slice(-5)) + timeSeed; // Use a different slice for a different result

        const percentage = Math.floor(getSeededRandom(combinedSeed) * 101);
        
        const responseMessage = `GheePT's 'Rainbow Radar' pings **${targetUser.username}** at **${percentage}%** fabulous for the next 12 hours. Werk it.`; //

        const embed = createGheeEmbed('🏳️‍🌈 Rainbow Radar', responseMessage);
        await interaction.editReply({ embeds: [embed] });
    },
};