// commands/vc_moderation/kickvc.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds');
const { logModerationAction } = require('../../utils/moderation');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kickvc')
        .setDescription('Kicks a member from their current voice channel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers)
        .addUserOption(option => option.setName('target').setDescription('The member to kick from VC.').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('The reason for the VC kick.')),

    async execute(interaction, db) {
        const target = interaction.options.getMember('target');
        const reason = interaction.options.getString('reason') || 'No reason provided.';
        
        if (!target.voice.channel) {
            return interaction.reply({ embeds: [createErrorEmbed("That user is not in a voice channel.")], ephemeral: true });
        }

        try {
            await target.voice.disconnect(reason);
            await interaction.reply({ embeds: [createSuccessEmbed(`${target.user.tag} has been disconnected from their voice channel.`)] });
            await logModerationAction(interaction, db, target.user, 'VC Kick', reason);
        } catch (error) {
            console.error(`Failed to VC kick ${target.user.tag}:`, error);
            await interaction.reply({ embeds: [createErrorEmbed("An error occurred while trying to disconnect the member.")] });
        }
    },
};