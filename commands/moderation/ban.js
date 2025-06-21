// commands/moderation/ban.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds');
const { logModerationAction } = require('../../utils/moderation');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Bans a member from the server.')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addUserOption(option => option.setName('target').setDescription('The member to ban.').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('The reason for the ban.')),

    async execute(interaction, db) {
        await interaction.deferReply({ ephemeral: true });
        const target = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason') || 'No reason provided.';

        const member = await interaction.guild.members.fetch(target.id).catch(() => null);
        if (member && !member.bannable) {
            return interaction.editReply({ embeds: [createErrorEmbed("I cannot ban this member. They may have a higher role than me.")] });
        }
        
        try {
            await interaction.guild.bans.create(target, { reason });
            await logModerationAction(interaction, db, target, 'Ban', reason);
            await interaction.editReply({ embeds: [createSuccessEmbed(`${target.tag} has been banned for: ${reason}`)] });
        } catch (error) {
            console.error(`Failed to ban ${target.tag}:`, error);
            await interaction.editReply({ embeds: [createErrorEmbed("An error occurred while trying to ban the member.")] });
        }
    },
};