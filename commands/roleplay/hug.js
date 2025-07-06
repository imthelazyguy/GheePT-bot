const { SlashCommandBuilder } = require('discord.js');
const { createGheeEmbed } = require('../../utils/embeds');
const { getGif } = require('../../utils/gifFetcher');

module.exports = {
    category: 'roleplay',
    data: new SlashCommandBuilder()
        .setName('hug')
        .setDescription('Give someone a warm hug.')
        .addUserOption(option => option.setName('user').setDescription('The person you want to hug.').setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();
        const user = interaction.user;
        const target = interaction.options.getUser('user');
        const gifUrl = await getGif('anime hug');
        const embed = createGheeEmbed('Aww, how sweet!', `${user} gives ${target} a big, warm hug!`).setImage(gifUrl);
        await interaction.editReply({ embeds: [embed] });
    },
};
