// commands/roleplay/lick.js
const { SlashCommandBuilder } = require('discord.js');
const { createGheeEmbed } = require('../../utils/embeds');
const { getGif } = require('../../utils/gifFetcher');

module.exports = {
    category: 'roleplay',
    data: new SlashCommandBuilder()
        .setName('lick')
        .setDescription('This is the taste of a liar, Giorno Giovanna!')
        .addUserOption(option => option.setName('user').setDescription('The person you want to... lick?').setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();
        const user = interaction.user;
        const target = interaction.options.getUser('user');
        
        const gifUrl = await getGif('anime lick');
        
        const embed = createGheeEmbed('Uhh...', `${user} licks ${target}. Gross.`)
            .setImage(gifUrl);
            
        await interaction.editReply({ embeds: [embed] });
    },
};
