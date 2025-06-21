// commands/vc_moderation/move.js
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('move')
        .setDescription('Moves a member to another voice channel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers)
        .addUserOption(option => option.setName('target').setDescription('The member to move.').setRequired(true))
        .addChannelOption(option => 
            option.setName('destination')
                .setDescription('The voice channel to move them to.')
                .addChannelTypes(ChannelType.GuildVoice)
                .setRequired(true)),

    async execute(interaction) {
        const target = interaction.options.getMember('target');
        const destination = interaction.options.getChannel('destination');
        
        if (!target.voice.channel) {
            return interaction.reply({ embeds: [createErrorEmbed("That user is not in a voice channel.")], ephemeral: true });
        }

        try {
            await target.voice.setChannel(destination);
            await interaction.reply({ embeds: [createSuccessEmbed(`${target.user.tag} has been moved to ${destination.name}.`)] });
        } catch (error) {
            console.error(`Failed to move ${target.user.tag}:`, error);
            await interaction.reply({ embeds: [createErrorEmbed("An error occurred.")] });
        }
    },
};