// commands/roleplay/cuddle.js
const { SlashCommandBuilder } = require('discord.js');
const { createGheeEmbed } = require('../../utils/embeds');
const { getGif } = require('../../utils/gifFetcher');

module.exports = {
    category: 'roleplay',
    data: new SlashCommandBuilder()
        .setName('cuddle')
        .setDescription('Get cozy and cuddle with someone.')
        .addUserOption(option => option.setName('user').setDescription('The person you want to cuddle.').setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();
        const gifUrl = await getGif('anime cuddle'); // Using the correct fetcher
        const embed = createGheeEmbed('So cozy...', `${interaction.user} cuddles up with ${interaction.options.getUser('user')}.`)
            .setImage(gifUrl);
        await interaction.editReply({ embeds: [embed] });
    },
};
