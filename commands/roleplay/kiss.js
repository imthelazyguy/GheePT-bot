const { SlashCommandBuilder } = require('discord.js');
const { createGheeEmbed } = require('../../utils/embeds');
const { getGif } = require('../../utils/gifFetcher');

module.exports = {
    category: 'roleplay',
    data: new SlashCommandBuilder()
        .setName('kiss')
        .setDescription('Give someone a little smooch.')
        .addUserOption(option => option.setName('user').setDescription('The person you want to kiss.').setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();
        const gifUrl = await getGif('anime kiss');
        const embed = createGheeEmbed('😘 Smooch!', `${interaction.user} gives ${interaction.options.getUser('user')} a sweet kiss!`).setImage(gifUrl);
        await interaction.editReply({ embeds: [embed] });
    },
};
