// commands/admin/status.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createGheeEmbed } = require('../../utils/embeds');
const os = require('os');

module.exports = {
    category: 'admin',
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Displays bot status and health information.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        await interaction.deferReply();
        
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor(uptime / 3600) % 24;
        const minutes = Math.floor(uptime / 60) % 60;
        const seconds = Math.floor(uptime % 60);
        const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;

        const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;

        const embed = createGheeEmbed('🤖 Bot Status & Health Check 🩺')
            .addFields(
                { name: 'Uptime', value: `\`${uptimeString}\``, inline: true },
                { name: 'Memory Usage', value: `\`${memoryUsage.toFixed(2)} MB\``, inline: true },
                { name: 'Discord API Ping', value: `\`${interaction.client.ws.ping}ms\``, inline: true },
                { name: 'Background Tasks', value: '`Voice XP & Ghee Drop are temporarily DISABLED for debugging.`', inline: false }
            );

        await interaction.editReply({ embeds: [embed] });
    },
};
