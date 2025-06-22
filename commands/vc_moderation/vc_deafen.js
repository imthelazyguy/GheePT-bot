// commands/vc_moderation/vc_undeafen.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds');

module.exports = {
    category: 'vc_moderation',
    data: new SlashCommandBuilder()
        .setName('vc_undeafen')
        .setDescription('Server undeafens a member in a voice channel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.DeafenMembers)
        .addUserOption(option => option.setName('target').setDescription('The member to undeafen.').setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const target = interaction.options.getMember('target');
        if (!target) return interaction.editReply({ embeds: [createErrorEmbed("That user isn't in the server.")] });

        if (!target.voice.channel) {
            return interaction.editReply({ embeds: [createErrorEmbed("That user is not in a voice channel.")] });
        }
        if (!target.voice.serverDeaf) {
            return interaction.editReply({ embeds: [createErrorEmbed("That user is not server deafened.")] });
        }

        try {
            await target.voice.setDeaf(false);
            await interaction.editReply({ embeds: [createSuccessEmbed(`${target.user.tag} has been server undeafened.`)] });
        } catch (error) {
            await interaction.editReply({ embeds: [createErrorEmbed("An error occurred.")] });
        }
    },
};
