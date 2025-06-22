// commands/utility/ping.js
const { SlashCommandBuilder } = require('discord.js');
const { createGheeEmbed } = require('../../utils/embeds');

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Checks how fast I am. (Spoiler: very fast).'),

    async execute(interaction) {
        console.log('[DEBUG] /ping: Step A - Entered execute function.');
        
        console.log('[DEBUG] /ping: Step B - About to defer reply...');
        const sent = await interaction.deferReply({ fetchReply: true });
        console.log('[DEBUG] /ping: Step C - Reply deferred successfully.');

        console.log('[DEBUG] /ping: Step D - Calculating latencies...');
        const websocketHeartbeat = interaction.client.ws.ping;
        const roundtripLatency = sent.createdTimestamp - interaction.createdTimestamp;
        console.log(`[DEBUG] /ping: Step E - Latencies calculated. WS: ${websocketHeartbeat}ms, RT: ${roundtripLatency}ms.`);

        const embed = createGheeEmbed(
            '🏓 Pong! Here\'s the Deal.',
            "Yeah, I'm pretty quick. Try to keep up."
        ).addFields(
            { name: 'API Latency (Roundtrip)', value: `\`${roundtripLatency}ms\``, inline: true },
            { name: 'WebSocket Ping', value: `\`${websocketHeartbeat}ms\``, inline: true }
        );
        console.log('[DEBUG] /ping: Step F - Embed built.');

        console.log('[DEBUG] /ping: Step G - About to send final reply...');
        await interaction.editReply({ embeds: [embed] });
        console.log('[DEBUG] /ping: Step H - Final reply sent.');
    },
};
