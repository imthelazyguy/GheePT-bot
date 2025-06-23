// commands/admin/fixuser.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');

module.exports = {
    category: 'admin',
    data: new SlashCommandBuilder()
        .setName('fixuser')
        .setDescription('Resets a user\'s core data to safe defaults if they are bugged.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addUserOption(option => option.setName('user').setDescription('The user whose data you want to fix.').setRequired(true)),

    async execute(interaction, db) {
        await interaction.deferReply({ ephemeral: true });
        const targetUser = interaction.options.getUser('user');

        if (targetUser.bot) {
            return interaction.editReply({ embeds: [createErrorEmbed("You cannot fix a bot's data.")] });
        }

        const userRef = db.collection('users').doc(`${interaction.guild.id}-${targetUser.id}`);

        try {
            const userDoc = await userRef.get();
            const data = userDoc.data() || {};
            
            const updatePayload = {};
            if (typeof data.level !== 'number') updatePayload.level = 1;
            if (typeof data.spotCoins !== 'number') updatePayload.spotCoins = 0;
            if (typeof data.chatXp !== 'number') updatePayload.chatXp = 0;
            if (typeof data.voiceXp !== 'number') updatePayload.voiceXp = 0;

            if (Object.keys(updatePayload).length > 0) {
                await userRef.set(updatePayload, { merge: true });
                await interaction.editReply({ embeds: [createSuccessEmbed(`${targetUser.username}'s data has been repaired. Missing fields were initialized.`)] });
            } else {
                await interaction.editReply({ embeds: [createSuccessEmbed(`${targetUser.username}'s data appears to be healthy. No changes were made.`)] });
            }
        } catch (error) {
            console.error('Error fixing user data:', error);
            await interaction.editReply({ embeds: [createErrorEmbed('An error occurred while trying to fix the user data.')] });
        }
    },
};
