// commands/utility/ping.js
const { SlashCommandBuilder, MessageFlags } = require('discord.js'); // Import MessageFlags
const { createGheeEmbed } = require('../../utils/embeds');

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription("Checks my response time. See if I'm lagging or if it's just you."),

    async execute(interaction) {
        // Use the new syntax for deferring an ephemeral reply
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        // Fetch the reply separately
        const sent = await interaction.fetchReply();

        const roundtripLatency = sent.createdTimestamp - interaction.createdTimestamp;
        const websocketHeartbeat = interaction.client.ws.ping;

        const embed = createGheeEmbed('🏓 Pong!', "My response time is faster than your last situationship.")
            .addFields(
                { name: 'API Latency', value: `\`${roundtripLatency}ms\``, inline: true },
                { name: 'WebSocket Ping', value: `\`${websocketHeartbeat}ms\``, inline: true }
            );
        
        await interaction.editReply({ embeds: [embed] });
    },
};
