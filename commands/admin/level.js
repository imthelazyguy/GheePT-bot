// commands/admin/level.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');

module.exports = {
    category: 'admin',
    data: new SlashCommandBuilder()
        .setName('level')
        .setDescription('Manually manage user levels.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription("Set a user's level to a specific number.")
                .addUserOption(option => option.setName('user').setDescription('The user to modify.').setRequired(true))
                .addIntegerOption(option => option.setName('level').setDescription('The level to set.').setRequired(true).setMinValue(1))),

    async execute(interaction, db) {
        if (!interaction.inGuild()) return;
        await interaction.deferReply({ ephemeral: true });

        const subcommand = interaction.options.getSubcommand();
        if (subcommand === 'set') {
            const targetUser = interaction.options.getUser('user');
            const newLevel = interaction.options.getInteger('level');
            const userRef = db.collection('users').doc(`${interaction.guild.id}-${targetUser.id}`);

            try {
                await userRef.set({ level: newLevel }, { merge: true });
                await interaction.editReply({ embeds: [createSuccessEmbed(`Successfully set ${targetUser.username}'s level to **${newLevel}**.`)] });
            } catch (error) {
                console.error(`Failed to set level for ${targetUser.id}:`, error);
                await interaction.editReply({ embeds: [createErrorEmbed("An error occurred while updating the user's level.")] });
            }
        }
    },
};
