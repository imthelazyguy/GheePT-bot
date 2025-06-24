// commands/utility/ping.js
const { SlashCommandBuilder } = require('discord.js');
const { createGheeEmbed } = require('../../utils/embeds');

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Checks the bot\'s latency and response time.'),

    async execute(interaction) {
        console.log('[PING_DEBUG] Step A: Entered execute function.');
        
        try {
            console.log('[PING_DEBUG] Step B: About to send initial reply (deferReply)...');
            const sent = await interaction.deferReply({ fetchReply: true });
            console.log('[PING_DEBUG] Step C: Initial reply sent successfully.');

            console.log('[PING_DEBUG] Step D: Calculating latencies...');
            const websocketHeartbeat = interaction.client.ws.ping;
            const roundtripLatency = sent.createdTimestamp - interaction.createdTimestamp;
            console.log(`[PING_DEBUG] Step E: Latencies calculated.`);

            const embed = createGheeEmbed('🏓 Pong!', "Yeah, I'm pretty quick. Try to keep up.")
                .addFields(
                    { name: 'API Latency (Roundtrip)', value: `\`${roundtripLatency}ms\``, inline: true },
                    { name: 'WebSocket Ping', value: `\`${websocketHeartbeat}ms\``, inline: true }
                );
            console.log('[PING_DEBUG] Step F: Embed built.');

            console.log('[PING_DEBUG] Step G: About to send final reply (editReply)...');
            await interaction.editReply({ embeds: [embed] });
            console.log('[PING_DEBUG] Step H: Final reply sent.');
        } catch (e) {
            console.error('[PING_DEBUG] CRITICAL ERROR IN PING COMMAND:', e);
        }
    },
};
