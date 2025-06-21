// commands/roleplay/tease.js
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createGheeEmbed, createErrorEmbed } = require('../../utils/embeds');
const { FieldValue } = require('firebase-admin/firestore');
const { logModerationAction } = require('../../utils/moderation'); // For the shaming log

async function runShame(interaction, config) {
    const shameRole = await interaction.guild.roles.fetch(config.roleIdShame).catch(() => null);
    if (!shameRole) return; // Shame role not configured or found
    
    // Assign shame role for 1 hour
    await interaction.member.roles.add(shameRole);
    setTimeout(() => interaction.member.roles.remove(shameRole).catch(e => console.error(e)), 60 * 60 * 1000);
    
    const shameMessage = `Oh, look! We've got a live one! ${interaction.user} just pulled a Drake move in public. Time to go back to your room, boomer, the kids are watching!`;
    await interaction.channel.send(shameMessage);
    await logModerationAction(interaction, interaction.user, 'Auto-Shame', 'Used lewd command in public channel.');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tease')
        .setDescription('Playfully tease someone.')
        .addUserOption(option => option.setName('user').setDescription('The user to tease.').setRequired(true)),

    async execute(interaction, db) {
        const configDoc = await db.collection('guilds').doc(interaction.guild.id).get();
        const config = configDoc.data() || {};
        const lewdChannels = (await db.collection('guilds').doc(interaction.guild.id).collection('lewd_channels').get()).docs.map(d => d.id);
        
        // --- Shame Check ---
        if (!lewdChannels.includes(interaction.channelId) && interaction.member.roles.cache.has(config.roleId18Plus)) {
            await runShame(interaction, config);
            return interaction.reply({ embeds: [createErrorEmbed("You've been naughty in public. Check the chat.")], ephemeral: true });
        }

        // --- Channel & Consent Check ---
        if (!lewdChannels.includes(interaction.channelId)) {
            return interaction.reply({ embeds: [createErrorEmbed('This command can only be used in designated lewd channels.')], ephemeral: true });
        }

        const userDocRef = db.collection('users').doc(`${interaction.guild.id}-${interaction.user.id}`);
        const userDoc = await userDocRef.get();
        if (!userDoc.exists || !userDoc.data().hasConsentedToLewd) {
            const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('consent_lewd').setLabel('I Understand and Consent').setStyle(ButtonStyle.Danger));
            const embed = createGheeEmbed('🔞 Consent Required', 'This is a "lewd" command. By clicking consent, you affirm you are 18+ and agree to see/participate in suggestive, humorous content. This is a one-time choice.');
            return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
        }
        
        // --- Command Logic ---
        await userDocRef.update({ lewdCommandCount: FieldValue.increment(1) });
        const user = interaction.user;
        const target = interaction.options.getUser('user');
        const embed = createGheeEmbed('Ooh, Spicy!', `${user} playfully teases ${target}... what happens next? 😉`);
        await interaction.reply({ embeds: [embed] });
    },
};