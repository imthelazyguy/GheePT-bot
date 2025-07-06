const { SlashCommandBuilder } = require('discord.js');
const { createGheeEmbed } = require('../../utils/embeds');
const { getGif } = require('../../utils/gifFetcher');

module.exports = {
    category: 'roleplay',
    data: new SlashCommandBuilder()
        .setName('slap')
        .setDescription('Sometimes, a slap is necessary.')
        .addUserOption(option => option.setName('user').setDescription('The person who needs a slap.').setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();
        const gifUrl = await getGif('anime slap');
        const embed = createGheeEmbed('Ouch!', `${interaction.user} walks up and slaps ${interaction.options.getUser('user')}! How rude.`).setImage(gifUrl);
        await interaction.editReply({ embeds: [embed] });
    },
};
