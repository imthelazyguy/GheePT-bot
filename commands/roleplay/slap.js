// commands/roleplay/slap.js
const { SlashCommandBuilder } = require('discord.js');
const { createGheeEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slap')
        .setDescription('Slap some sense into someone.')
        .addUserOption(option => option.setName('user').setDescription('The person you want to slap.').setRequired(true)),

    async execute(interaction) {
        const user = interaction.user;
        const target = interaction.options.getUser('user');
        const embed = createGheeEmbed('Ouch!', `${user} slaps ${target} across the face! That's gotta sting.`)
            .setImage('https://i.imgur.com/o2SJYUS.gif');
        await interaction.reply({ embeds: [embed] });
    },
};