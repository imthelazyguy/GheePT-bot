// commands/vc_moderation/mutevc.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mutevc')
        .setDescription('Server mutes a member in a voice channel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers)
        .addUserOption(option => option.setName('target').setDescription('The member to mute.').setRequired(true))
        .addBooleanOption(option => option.setName('state').setDescription('Set to false to unmute.').setRequired(true)),

    async execute(interaction) {
        const target = interaction.options.getMember('target');
        const state = interaction.options.getBoolean('state');
        
        if (!target.voice.channel) {
            return interaction.reply({ embeds: [createErrorEmbed("That user is not in a voice channel.")], ephemeral: true });
        }

        try {
            await target.voice.setMute(state);
            await interaction.reply({ embeds: [createSuccessEmbed(`${target.user.tag} has been server ${state ? 'muted' : 'unmuted'}.`)] });
        } catch (error) {
            console.error(`Failed to VC mute ${target.user.tag}:`, error);
            await interaction.reply({ embeds: [createErrorEmbed("An error occurred.")] });
        }
    },
};