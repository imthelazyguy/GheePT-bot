// commands/vc_moderation/vc_unmute.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vc_unmute')
        .setDescription('Server unmutes a member in a voice channel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers)
        .addUserOption(option => option.setName('target').setDescription('The member to unmute.').setRequired(true)),

    async execute(interaction) {
        const target = interaction.options.getMember('target');
        if (!target.voice.channel) return interaction.reply({ embeds: [createErrorEmbed("That user is not in a voice channel.")], ephemeral: true });

        try {
            await target.voice.setMute(false);
            await interaction.reply({ embeds: [createSuccessEmbed(`${target.user.tag} has been server unmuted.`)] });
        } catch (error) {
            await interaction.reply({ embeds: [createErrorEmbed("An error occurred.")] });
        }
    },
};
