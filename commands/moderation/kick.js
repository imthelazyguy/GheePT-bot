// commands/moderation/kick.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds');
const { logModerationAction } = require('../../utils/moderation');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kicks a member from the server.')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addUserOption(option => option.setName('target').setDescription('The member to kick.').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('The reason for the kick.')),

    async execute(interaction, db) { // 'db' is available here
        await interaction.deferReply({ ephemeral: true });

        const targetMember = interaction.options.getMember('target');
        const reason = interaction.options.getString('reason') || 'No reason provided.';

        if (!targetMember) {
            return interaction.editReply({ embeds: [createErrorEmbed("That user is not on this server.")] });
        }
        if (!targetMember.kickable) {
            return interaction.editReply({ embeds: [createErrorEmbed("I cannot kick that member. They may have a higher role than me or I lack permissions.")] });
        }
        if (targetMember.id === interaction.user.id) {
            return interaction.editReply({ embeds: [createErrorEmbed("You can't kick yourself.")] });
        }

        try {
            await targetMember.kick(reason);
            // FIX: Pass the 'db' instance to the logging function
            await logModerationAction(interaction, db, targetMember.user, 'Kick', reason);
            
            await interaction.editReply({ embeds: [createSuccessEmbed(`${targetMember.user.tag} has been kicked for: ${reason}`)] });
        } catch (error) {
            console.error(`Failed to kick ${targetMember.user.tag}:`, error);
            await interaction.editReply({ embeds: [createErrorEmbed("An error occurred while trying to kick the member.")] });
        }
    },
};