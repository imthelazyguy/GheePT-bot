// commands/vc_moderation/deafen.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deafen')
        .setDescription('Server deafens a member in a voice channel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.DeafenMembers)
        .addUserOption(option => option.setName('target').setDescription('The member to deafen.').setRequired(true))
        .addBooleanOption(option => option.setName('state').setDescription('Set to false to undeafen.').setRequired(true)),

    async execute(interaction) {
        const target = interaction.options.getMember('target');
        const state = interaction.options.getBoolean('state');
        
        if (!target.voice.channel) {
            return interaction.reply({ embeds: [createErrorEmbed("That user is not in a voice channel.")], ephemeral: true });
        }

        try {
            await target.voice.setDeaf(state);
            await interaction.reply({ embeds: [createSuccessEmbed(`${target.user.tag} has been ${state ? 'deafened' : 'undeafened'}.`)] });
        } catch (error) {
            console.error(`Failed to deafen ${target.user.tag}:`, error);
            await interaction.reply({ embeds: [createErrorEmbed("An error occurred.")] });
        }
    },
};