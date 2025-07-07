// commands/admin/level.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');

module.exports = {
    category: 'admin',
    data: new SlashCommandBuilder()
        .setName('level')
        .setDescription('Manually manage user levels and XP.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand => subcommand
            .setName('setxp').setDescription("Set a user's total XP.")
            .addUserOption(option => option.setName('user').setDescription('The user to modify.').setRequired(true))
            .addIntegerOption(option => option.setName('amount').setDescription('The total amount of XP.').setRequired(true).setMinValue(0)))
        .addSubcommand(subcommand => subcommand
            .setName('setlevel').setDescription("Set a user's level (XP will be set to the minimum for that level).")
            .addUserOption(option => option.setName('user').setDescription('The user to modify.').setRequired(true))
            .addIntegerOption(option => option.setName('level').setDescription('The target level.').setRequired(true).setMinValue(0))),

    async execute(interaction, db) {
        await interaction.deferReply({ ephemeral: true });
        const subcommand = interaction.options.getSubcommand();
        const targetUser = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');
        const userRef = db.collection('users').doc(`${interaction.guild.id}-${targetUser.id}`);

        if (subcommand === 'setxp') {
            await userRef.set({ xp: amount }, { merge: true });
            return interaction.editReply({ embeds: [await createSuccessEmbed(interaction, db, `${targetUser.username}'s XP has been set to **${amount}**.`)] });
        }

        if (subcommand === 'setlevel') {
            const { getXpForLevel } = require('../../utils/leveling');
            const xpForLevel = getXpForLevel(amount - 1); // XP needed to *reach* this level
            await userRef.set({ level: amount, xp: xpForLevel }, { merge: true });
            return interaction.editReply({ embeds: [await createSuccessEmbed(interaction, db, `${targetUser.username} has been set to **Level ${amount}**.`)] });
        }
    },
};
