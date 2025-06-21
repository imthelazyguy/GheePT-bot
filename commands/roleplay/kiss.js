// commands/roleplay/kiss.js
const { SlashCommandBuilder } = require('discord.js');
const { createGheeEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kiss')
        .setDescription('Give someone a little smooch.')
        .addUserOption(option => option.setName('user').setDescription('The person you want to kiss.').setRequired(true)),

    async execute(interaction) {
        const user = interaction.user;
        const target = interaction.options.getUser('user');
        const embed = createGheeEmbed('Mwah!', `${user} gives ${target} a sweet kiss!`)
            .setImage('https://i.imgur.com/s4b4t5C.gif');
        await interaction.reply({ embeds: [embed] });
    },
};