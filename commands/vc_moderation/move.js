// commands/vc_moderation/move.js
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, ActionRowBuilder, ChannelSelectMenuBuilder } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('move')
        .setDescription('Moves a member to another voice channel via a dropdown menu.')
        .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers)
        .addUserOption(option => option.setName('target').setDescription('The member to move.').setRequired(true)),

    async execute(interaction) {
        const target = interaction.options.getMember('target');
        if (!target.voice.channel) {
            return interaction.reply({ embeds: [createErrorEmbed("That user is not in a voice channel.")], ephemeral: true });
        }
        
        const voiceChannels = interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice && c.id !== target.voice.channelId);
        if (voiceChannels.size === 0) {
            return interaction.reply({ embeds: [createErrorEmbed("There are no other voice channels to move this user to.")]});
        }

        const selectMenu = new ChannelSelectMenuBuilder()
            .setCustomId(`move_user_${target.id}`)
            .setPlaceholder('Select a destination channel...')
            .addChannelTypes(ChannelType.GuildVoice);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        
        const message = await interaction.reply({
            content: `Please select a channel to move ${target.user.username} to.`,
            components: [row],
            ephemeral: true
        });
        
        const collector = message.createMessageComponentCollector({ filter: i => i.user.id === interaction.user.id, time: 60000 });
        collector.on('collect', async i => {
            const destination = i.channels.first();
            try {
                await target.voice.setChannel(destination);
                await i.update({ content: `Successfully moved ${target.user.tag} to ${destination.name}.`, components: [] });
            } catch (error) {
                await i.update({ content: `Failed to move user.`, components: [] });
            }
        });
    },
};
