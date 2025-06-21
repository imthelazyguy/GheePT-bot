// commands/roleplay/poke.js
const { SlashCommandBuilder } = require('discord.js');
const { createGheeEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('poke')
        .setDescription('Annoy someone with a poke.')
        .addUserOption(option => option.setName('user').setDescription('The person you want to poke.').setRequired(true)),

    async execute(interaction) {
        const user = interaction.user;
        const target = interaction.options.getUser('user');
        const embed = createGheeEmbed('Hey! Listen!', `${user} pokes ${target}. Annoying, yet effective.`)
            .setImage('https://i.imgur.com/H41G2iH.gif');
        await interaction.reply({ embeds: [embed] });
    },
};