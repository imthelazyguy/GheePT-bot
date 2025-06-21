// commands/utility/ping.js
const { SlashCommandBuilder } = require('discord.js');
const { createGheeEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Checks how fast I am. (Spoiler: very fast).'),

    async execute(interaction) {
        // Send an initial reply to get a timestamp. fetchReply: true is crucial.
        const sent = await interaction.deferReply({ fetchReply: true });

        // WebSocket Heartbeat: The bot's direct, constant connection to Discord's gateway.
        const websocketHeartbeat = interaction.client.ws.ping;

        // Roundtrip Latency: The time between you sending the command and the bot sending its initial response.
        const roundtripLatency = sent.createdTimestamp - interaction.createdTimestamp;

        const embed = createGheeEmbed(
            '🏓 Pong! Here\'s the Deal.',
            "Yeah, I'm pretty quick. Try to keep up."
        ).addFields(
            { name: 'API Latency (Roundtrip)', value: `\`${roundtripLatency}ms\``, inline: true },
            { name: 'WebSocket Ping', value: `\`${websocketHeartbeat}ms\``, inline: true }
        );

        // Edit the initial reply with the final results.
        await interaction.editReply({ embeds: [embed] });
    },
};