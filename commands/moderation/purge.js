// commands/moderation/purge.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Deletes a specified number of messages from a channel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addIntegerOption(option => 
            option.setName('amount')
                .setDescription('Number of messages to delete (1-100).')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100))
        .addUserOption(option => 
            option.setName('user')
                .setDescription('Only delete messages from this user.')
                .setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const amount = interaction.options.getInteger('amount');
        const user = interaction.options.getUser('user');

        try {
            let messages = await interaction.channel.messages.fetch({ limit: amount });
            if (user) {
                messages = messages.filter(m => m.author.id === user.id);
            }

            const deletedMessages = await interaction.channel.bulkDelete(messages, true); // `true` filters out messages older than 14 days

            if (deletedMessages.size === 0) {
                return interaction.editReply({ embeds: [createErrorEmbed("No messages were deleted. They may be older than 14 days.")] });
            }

            await interaction.editReply({ embeds: [createSuccessEmbed(`Successfully purged ${deletedMessages.size} messages.`)] });

        } catch (error) {
            console.error('Failed to purge messages:', error);
            await interaction.editReply({ embeds: [createErrorEmbed('An error occurred while purging messages.')] });
        }
    },
};