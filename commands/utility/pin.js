// commands/utility/pin.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pin')
        .setDescription('Pins a message in this channel. Don\'t pin cringe.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addStringOption(option =>
            option.setName('message_id')
                .setDescription('The ID of the message you want to pin.')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const messageId = interaction.options.getString('message_id');

        try {
            const message = await interaction.channel.messages.fetch(messageId);

            if (message.pinned) {
                return interaction.editReply({ embeds: [createErrorEmbed("This message is already pinned, genius.")] });
            }

            await message.pin();
            await interaction.editReply({ embeds: [createSuccessEmbed('Message pinned successfully. It better have been worth it.')] });

        } catch (error) {
            console.error("Pin command error:", error);
            if (error.code === 10008) { // Unknown Message
                await interaction.editReply({ embeds: [createErrorEmbed("I couldn't find a message with that ID in this channel.")] });
            } else if (error.code === 30003) { // Maximum number of pins reached
                await interaction.editReply({ embeds: [createErrorEmbed("This channel has reached its maximum of 50 pinned messages. Unpin something first.")] });
            } else {
                await interaction.editReply({ embeds: [createErrorEmbed("Something went wrong while trying to pin that message.")] });
            }
        }
    },
};