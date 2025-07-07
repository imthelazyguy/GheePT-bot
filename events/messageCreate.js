// commands/admin/level.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');
const { getXpForLevel } = require('../../utils/leveling');

module.exports = {
    category: 'admin',
    data: new SlashCommandBuilder()
        .setName('level')
        .setDescription('Manually manage user levels and XP.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand.setName('setxp')
                .setDescription("Set a user's total XP.")
                .addUserOption(option => option.setName('user').setDescription('The user to modify.').setRequired(true))
                .addIntegerOption(option => option.setName('amount').setDescription('The total amount of XP.').setRequired(true).setMinValue(0)))
        .addSubcommand(subcommand =>
            subcommand.setName('setlevel')
                .setDescription("Set a user's level (XP will be set to the minimum for that level).")
                .addUserOption(option => option.setName('user').setDescription('The user to modify.').setRequired(true))
                .addIntegerOption(option => option.setName('level').setDescription('The target level.').setRequired(true).setMinValue(0))),

    async execute(interaction, db) {
        await interaction.deferReply({ ephemeral: true });
        const subcommand = interaction.options.getSubcommand();
        const targetUser = interaction.options.getUser('user');
        const userRef = db.collection('users').doc(`${interaction.guild.id}-${targetUser.id}`);

        if (targetUser.bot) {
            return interaction.editReply({ embeds: [await createErrorEmbed(interaction, db, "Bots do not participate in the leveling system.")] });
        }

        if (subcommand === 'setxp') {
            const amount = interaction.options.getInteger('amount');
            // When setting XP, we should update both total and chat XP for simplicity
            await userRef.set({ xp: amount, chatXp: amount }, { merge: true });
            return interaction.editReply({ embeds: [await createSuccessEmbed(interaction, db, `${targetUser.username}'s XP has been set to **${amount.toLocaleString()}**.`)] });
        }

        if (subcommand === 'setlevel') {
            const level = interaction.options.getInteger('level');
            const xpForLevel = getXpForLevel(level > 0 ? level - 1 : 0);
            await userRef.set({ level: level, xp: xpForLevel, chatXp: xpForLevel }, { merge: true });
            return interaction.editReply({ embeds: [await createSuccessEmbed(interaction, db, `${targetUser.username} has been set to **Level ${level}**.`)] });
        }
    },
};
