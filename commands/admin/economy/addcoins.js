// commands/admin/economy/addcoins.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../../utils/embeds');
const { FieldValue } = require('firebase-admin/firestore');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addcoins')
        .setDescription('Adds Spot Coins to a user\'s balance. (Owner Only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) // Extra safeguard
        .addUserOption(option => option.setName('user').setDescription('The user to give coins to.').setRequired(true))
        .addIntegerOption(option => option.setName('amount').setDescription('The amount of coins to add.').setRequired(true).setMinValue(1)),

    async execute(interaction, db) {
        const { OWNER_IDS } = require('../../../config');
        if (!OWNER_IDS.includes(interaction.user.id)) {
            return interaction.reply({ embeds: [createErrorEmbed('This command can only be used by the bot owner.')], ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });
        const targetUser = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');
        const userDocRef = db.collection('users').doc(`${interaction.guild.id}-${targetUser.id}`);

        try {
            await userDocRef.set({
                spotCoins: FieldValue.increment(amount)
            }, { merge: true });
            await interaction.editReply({ embeds: [createSuccessEmbed(`Successfully added ${amount} SC to ${targetUser.username}'s balance.`)] });
        } catch (error) {
            console.error(`Failed to add coins for user ${targetUser.id}:`, error);
            await interaction.editReply({ embeds: [createErrorEmbed('A database error occurred.')] });
        }
    },
};