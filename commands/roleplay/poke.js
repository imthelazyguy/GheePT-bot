const { SlashCommandBuilder } = require('discord.js');
const { createGheeEmbed } = require('../../utils/embeds');
const { getGif } = require('../../utils/gifFetcher');

module.exports = {
    category: 'roleplay',
    data: new SlashCommandBuilder()
        .setName('poke')
        .setDescription('Annoy someone with a poke.')
        .addUserOption(option => option.setName('user').setDescription('The person you want to poke.').setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();
        const gifUrl = await getGif('anime poke');
        const embed = createGheeEmbed('Hey! Listen!', `${interaction.user} pokes ${interaction.options.getUser('user')} to get their attention.`).setImage(gifUrl);
        await interaction.editReply({ embeds: [embed] });
    },
};
