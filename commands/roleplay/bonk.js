// commands/roleplay/bonk.js
const { SlashCommandBuilder } = require('discord.js');
const { createGheeEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bonk')
        .setDescription('Bonk someone for being naughty.')
        .addUserOption(option => option.setName('user').setDescription('The person you want to bonk.').setRequired(true)),

    async execute(interaction) {
        const user = interaction.user;
        const target = interaction.options.getUser('user');
        const embed = createGheeEmbed('Go to Horny Jail!', `${user} bonks ${target} right on the head!`)
            .setImage('https://i.imgur.com/w4p4zBs.gif');
        await interaction.reply({ embeds: [embed] });
    },
};