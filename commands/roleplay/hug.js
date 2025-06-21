// commands/roleplay/hug.js
const { SlashCommandBuilder } = require('discord.js');
const { createGheeEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hug')
        .setDescription('Give someone a warm hug.')
        .addUserOption(option => option.setName('user').setDescription('The person you want to hug.').setRequired(true)),

    async execute(interaction) {
        const user = interaction.user;
        const target = interaction.options.getUser('user');
        const embed = createGheeEmbed('Aww, how sweet!', `${user} gives ${target} a big, warm hug!`)
            .setImage('https://i.imgur.com/r9aU2xv.gif'); // Example GIF
        await interaction.reply({ embeds: [embed] });
    },
};