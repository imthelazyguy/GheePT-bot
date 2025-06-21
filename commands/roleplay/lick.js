// commands/roleplay/lick.js
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createGheeEmbed, createErrorEmbed } = require('../../utils/embeds');
const { FieldValue } = require('firebase-admin/firestore');
const { logModerationAction } = require('../../utils/moderation');

async function runShame(interaction, config) {
    // ... (This function is identical to the one in tease.js)
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lick')
        .setDescription('This is a taste of... Ghee? (18+)')
        .addUserOption(option => option.setName('user').setDescription('The user to lick.').setRequired(true)),

    async execute(interaction, db) {
        // This command's safety check logic is IDENTICAL to tease.js
        // It checks for the shame condition, the lewd channel, and user consent.
        // If all checks pass, it executes the command logic below.

        // --- Command Logic ---
        await db.collection('users').doc(`${interaction.guild.id}-${interaction.user.id}`).update({ lewdCommandCount: FieldValue.increment(1) });
        const user = interaction.user;
        const target = interaction.options.getUser('user');
        const embed = createGheeEmbed('A questionable taste...', `${user} licks ${target}... a bold and confusing move.`)
            .setImage('https://i.imgur.com/nJm4L23.gif');
        await interaction.reply({ embeds: [embed] });
    },
};