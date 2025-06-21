// commands/moderation/unmute.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds');
const { logModerationAction } = require('../../utils/moderation');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Removes a timeout from a member.')
        .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers)
        .addUserOption(option => option.setName('target').setDescription('The member to unmute.').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('The reason for the unmute.')),

    async execute(interaction, db) {
        await interaction.deferReply({ ephemeral: true });
        const target = interaction.options.getMember('target');
        const reason = interaction.options.getString('reason') || 'Mercy was shown.';

        if (!target.moderatable) {
            return interaction.editReply({ embeds: [createErrorEmbed("I cannot unmute this member.")] });
        }

        if (!target.isCommunicationDisabled()) {
            return interaction.editReply({ embeds: [createErrorEmbed("This member is not currently muted.")] });
        }

        try {
            await target.timeout(null, reason); // Setting timeout to null removes it
            await logModerationAction(interaction, db, target.user, 'Unmute', reason);
            await interaction.editReply({ embeds: [createSuccessEmbed(`${target.user.tag} has been unmuted.`)] });
        } catch (error) {
            console.error(`Failed to unmute ${target.user.tag}:`, error);
            await interaction.editReply({ embeds: [createErrorEmbed("An error occurred while trying to unmute the member.")] });
        }
    },
};