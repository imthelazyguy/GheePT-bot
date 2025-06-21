// commands/moderation/mute.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds');
const { logModerationAction } = require('../../utils/moderation');
const ms = require('ms'); // Run `npm install ms` for this package

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Mutes a member for a specified duration (aka timeout).')
        .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers)
        .addUserOption(option => option.setName('target').setDescription('The member to mute.').setRequired(true))
        .addStringOption(option => option.setName('duration').setDescription('Duration of the mute (e.g., 10m, 1h, 1d).').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('The reason for the mute.')),

    async execute(interaction, db) {
        await interaction.deferReply({ ephemeral: true });
        const target = interaction.options.getMember('target');
        const durationStr = interaction.options.getString('duration');
        const reason = interaction.options.getString('reason') || 'No reason provided.';
        
        const durationMs = ms(durationStr);
        if (!durationMs || durationMs > ms('28d')) {
            return interaction.editReply({ embeds: [createErrorEmbed("Invalid duration provided. Maximum duration is 28 days.")] });
        }

        if (!target.moderatable) {
            return interaction.editReply({ embeds: [createErrorEmbed("I cannot mute this member.")] });
        }

        try {
            await target.timeout(durationMs, reason);
            await logModerationAction(interaction, db, target.user, 'Mute (Timeout)', reason, durationStr);
            await interaction.editReply({ embeds: [createSuccessEmbed(`${target.user.tag} has been muted for ${durationStr}. Reason: ${reason}`)] });
        } catch (error) {
            console.error(`Failed to mute ${target.user.tag}:`, error);
            await interaction.editReply({ embeds: [createErrorEmbed("An error occurred while trying to mute the member.")] });
        }
    },
};