// commands/roleplay/tease.js
const { SlashCommandBuilder } = require('discord.js');
const { createGheeEmbed } = require('../../utils/embeds');
const { getGif } = require('../../utils/gifFetcher');

module.exports = {
    category: 'roleplay',
    data: new SlashCommandBuilder()
        .setName('tease')
        .setDescription('Tease someone a little.')
        .addUserOption(option => option.setName('user').setDescription('The person you want to tease.').setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();
        const user = interaction.user;
        const target = interaction.options.getUser('user');
        
        const gifUrl = await getGif('anime tease');
        
        const embed = createGheeEmbed('Heh.', `${user} is teasing ${target}.`)
            .setImage(gifUrl);
            
        await interaction.editReply({ embeds: [embed] });
    },
};
