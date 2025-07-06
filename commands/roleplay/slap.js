// commands/roleplay/slap.js
const { SlashCommandBuilder } = require('discord.js');
const { createGheeEmbed } = require('../../utils/embeds');
const { getGif } = require('../../utils/gifFetcher'); // Correctly uses the new fetcher

module.exports = {
    category: 'roleplay',
    data: new SlashCommandBuilder()
        .setName('slap')
        .setDescription('Sometimes, a slap is necessary.')
        .addUserOption(option => option.setName('user').setDescription('The person who needs a slap.').setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();
        const user = interaction.user;
        const target = interaction.options.getUser('user');
        
        const gifUrl = await getGif('anime slap');
        
        const embed = createGheeEmbed('Ouch!', `${user} walks up and slaps ${target}! How rude.`)
            .setImage(gifUrl);
            
        await interaction.editReply({ embeds: [embed] });
    },
};
