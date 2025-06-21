// commands/vc_moderation/moveall.js
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('moveall')
        .setDescription('Moves all members from a specific voice channel to another.')
        .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers)
        .addChannelOption(option => 
            option.setName('source')
                .setDescription('The voice channel to move members FROM.')
                .addChannelTypes(ChannelType.GuildVoice)
                .setRequired(true))
        .addChannelOption(option => 
            option.setName('destination')
                .setDescription('The voice channel to move members TO.')
                .addChannelTypes(ChannelType.GuildVoice)
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const sourceChannel = interaction.options.getChannel('source');
        const destinationChannel = interaction.options.getChannel('destination');

        if (sourceChannel.id === destinationChannel.id) {
            return interaction.editReply({ embeds: [createErrorEmbed('The source and destination channels cannot be the same.')] });
        }

        const membersToMove = sourceChannel.members;
        if (membersToMove.size === 0) {
            return interaction.editReply({ embeds: [createErrorEmbed(`The source channel "${sourceChannel.name}" is empty.`)] });
        }

        let successCount = 0;
        let failCount = 0;

        const movePromises = membersToMove.map(member => 
            member.voice.setChannel(destinationChannel)
                .then(() => successCount++)
                .catch(error => {
                    console.error(`Failed to move ${member.user.tag}:`, error);
                    failCount++;
                })
        );

        try {
            await Promise.all(movePromises);

            const summaryEmbed = createSuccessEmbed('Bulk Move Operation Complete')
                .setDescription(`Moved members from ${sourceChannel} to ${destinationChannel}.`)
                .addFields(
                    { name: 'Successfully Moved', value: `${successCount} members`, inline: true },
                    { name: 'Failed to Move', value: `${failCount} members`, inline: true }
                );
            await interaction.editReply({ embeds: [summaryEmbed] });
        } catch (error) {
            console.error('An unexpected error occurred during the moveall operation:', error);
            await interaction.editReply({ embeds: [createErrorEmbed('A critical error occurred during the move operation.')] });
        }
    },
};