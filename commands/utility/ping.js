// commands/utility/ping.js
const { SlashCommandBuilder } = require('discord.js');
const { createGheeEmbed } = require('../../utils/embeds');

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription("Checks my response time. See if I'm lagging or if it's just you."),

    async execute(interaction) {
        // Send an initial reply and fetch it to calculate the roundtrip time.
        // We make it ephemeral so it doesn't clutter the chat.
        const sent = await interaction.deferReply({ ephemeral: true, fetchReply: true });

        // Measures the time between the command being sent and the bot's acknowledgment.
        const roundtripLatency = sent.createdTimestamp - interaction.createdTimestamp;

        // Measures the bot's stable connection health to Discord's servers.
        const websocketHeartbeat = interaction.client.ws.ping;

        const embed = createGheeEmbed(
            '🏓 Pong!',
            "My response time is faster than your last situationship."
        ).addFields(
            { name: 'API Latency', value: `\`${roundtripLatency}ms\``, inline: true },
            { name: 'WebSocket Ping', value: `\`${websocketHeartbeat}ms\``, inline: true }
        );

        // Edit the initial reply with the final embed containing the latency info.
        await interaction.editReply({ embeds: [embed] });
    },
};
