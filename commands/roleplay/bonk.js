// commands/roleplay/bonk.js
const { SlashCommandBuilder } = require('discord.js');
const { createGheeEmbed } = require('../../utils/embeds');
const { getGif } = require('../../utils/gifFetcher');

module.exports = {
    category: 'roleplay',
    data: new SlashCommandBuilder()
        .setName('bonk')
        .setDescription('Send someone to horny jail.')
        .addUserOption(option => option.setName('user').setDescription('The person to bonk.').setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();
        const user = interaction.user;
        const target = interaction.options.getUser('user');
        
        const gifUrl = await getGif('anime bonk');
        
        const embed = createGheeEmbed('BONK!', `${user} sends ${target} to horny jail.`)
            .setImage(gifUrl);
            
        await interaction.editReply({ embeds: [embed] });
    },
};
