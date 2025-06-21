// commands/social/profile.js
const { SlashCommandBuilder } = require('discord.js');
const { createGheeEmbed, createErrorEmbed } = require('../../utils/embeds');
const { getXpForNextLevel } = require('../../utils/leveling');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('Displays your or another user\'s GheeSpot profile card.')
        .addUserOption(option => option.setName('user').setDescription('The user whose profile to view.')),
    
    async execute(interaction, db) {
        await interaction.deferReply();
        const targetUser = interaction.options.getUser('user') || interaction.user;

        if (targetUser.bot) {
            return interaction.editReply({ embeds: [createErrorEmbed("Bots are soulless machines with no profile.")] });
        }
        
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        if (!targetMember) {
            return interaction.editReply({ embeds: [createErrorEmbed("Could not find that member on the server.")] });
        }

        const userDocRef = db.collection('users').doc(`${interaction.guild.id}-${targetUser.id}`);
        const guildDocRef = db.collection('guilds').doc(interaction.guild.id);

        const [userDoc, guildDoc] = await Promise.all([userDocRef.get(), guildDocRef.get()]);
        
        const data = userDoc.data() || {};
        const config = guildDoc.data() || {};

        const level = data.level || 1;
        const chatXp = data.chatXp || 0;
        const voiceXp = data.voiceXp || 0;
        const totalXp = chatXp + voiceXp;
        const xpForNext = getXpForNextLevel(level);

        const embed = createGheeEmbed(`Profile Card: ${targetUser.username}`)
            .setThumbnail(targetUser.displayAvatarURL());
        
        if (config.roleIdShame && targetMember.roles.cache.has(config.roleIdShame)) {
            embed.addFields({ name: '⚠️ Current Status', value: 'Currently in the doghouse for being a public menace.' });
        }
        
        embed.addFields(
            { name: 'Level', value: `\`📈 ${level}\``, inline: true },
            { name: 'Spot Coins', value: `\`🪙 ${(data.spotCoins || 0).toLocaleString()}\``, inline: true },
            { name: 'Progress to Next Level', value: `\`⚡ ${totalXp.toLocaleString()} / ${xpForNext.toLocaleString()}\``, inline: false },
            { name: 'Chat XP', value: `\`💬 ${chatXp.toLocaleString()}\``, inline: true },
            { name: 'Voice XP', value: `\`🎤 ${voiceXp.toLocaleString()}\``, inline: true }
        );

        if (data.relationship) {
            const partner = await interaction.client.users.fetch(data.relationship.with[0]).catch(() => null);
            embed.addFields({ name: 'Relationship Status', value: `💞 ${data.relationship.type} with ${partner ? partner.tag : 'a mysterious figure'}.`, inline: false });
        }
        
        // NEW: Medals of Honor
        if (data.honors && data.honors.length > 0) {
            const honorsRef = db.collection('guilds').doc(interaction.guild.id).collection('honors');
            const honorsSnapshot = await honorsRef.where(db.FieldPath.documentId(), 'in', data.honors).get();
            const honorsList = honorsSnapshot.docs.map(doc => {
                const honor = doc.data();
                return `${honor.emoji} **${honor.name}**`;
            }).join('\n');
            embed.addFields({ name: '🎖️ Medals of Honor', value: honorsList || 'None' });
        }

        await interaction.editReply({ embeds: [embed] });
    },
};