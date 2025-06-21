// utils/moderation.js
const { createGheeEmbed } = require('./embeds'); // FIX: Corrected the path from '../../utils/embeds' to './embeds'

// FIX: Added 'db' as a parameter to the function
async function logModerationAction(interaction, db, target, action, reason, duration = null) {
    const guildId = interaction.guild.id;

    try {
        const configDoc = await db.collection('guilds').doc(guildId).get();
        if (!configDoc.exists) return;
        
        const config = configDoc.data();
        if (!config.modLogChannelId) return; // Mod log channel not configured

        const logChannel = await interaction.guild.channels.fetch(config.modLogChannelId).catch(() => null);
        if (!logChannel) {
            console.warn(`Mod log channel not found for guild ${guildId}.`);
            return;
        }

        const embed = createGheeEmbed(`Moderation Log: ${action}`, ``, 'Red')
            .addFields(
                { name: 'Target User', value: `${target.tag} (${target.id})`, inline: true },
                { name: 'Moderator', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                { name: 'Reason', value: reason || 'No reason provided.' }
            );

        if (duration) {
            embed.addFields({ name: 'Duration', value: duration });
        }

        await logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error(`Failed to send moderation log for guild ${guildId}:`, error);
    }
}

module.exports = { logModerationAction };