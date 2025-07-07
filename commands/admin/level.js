// commands/admin/level.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');
const { getXpForLevel } = require('../../utils/leveling');
const { createLevelUpCard } = require('../../utils/cardGenerator');

module.exports = {
    category: 'admin',
    data: new SlashCommandBuilder()
        .setName('level')
        .setDescription('Manually manage user levels and XP, or test level-up cards.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand => subcommand
            .setName('setxp').setDescription("Set a user's total XP.")
            .addUserOption(option => option.setName('user').setDescription('The user to modify.').setRequired(true))
            .addIntegerOption(option => option.setName('amount').setDescription('The total amount of XP.').setRequired(true).setMinValue(0)))
        .addSubcommand(subcommand => subcommand
            .setName('setlevel').setDescription("Set a user's level (XP will be set to the minimum for that level).")
            .addUserOption(option => option.setName('user').setDescription('The user to modify.').setRequired(true))
            .addIntegerOption(option => option.setName('level').setDescription('The target level.').setRequired(true).setMinValue(0)))
        // --- NEW SUBCOMMAND ---
        .addSubcommand(subcommand => subcommand
            .setName('testcard').setDescription("Generate a test level-up card for a user.")
            .addUserOption(option => option.setName('user').setDescription('The user to generate the card for.').setRequired(true))),

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
            await userRef.set({ xp: amount }, { merge: true });
            return interaction.editReply({ embeds: [await createSuccessEmbed(interaction, db, `${targetUser.username}'s XP has been set to **${amount}**.`)] });
        }

        if (subcommand === 'setlevel') {
            const level = interaction.options.getInteger('level');
            const xpForLevel = getXpForLevel(level - 1); // XP needed to *reach* this level
            await userRef.set({ level: level, xp: xpForLevel }, { merge: true });
            return interaction.editReply({ embeds: [await createSuccessEmbed(interaction, db, `${targetUser.username} has been set to **Level ${level}**.`)] });
        }

        if (subcommand === 'testcard') {
            try {
                const targetMember = await interaction.guild.members.fetch(targetUser.id);
                const userDoc = await userRef.get();
                const data = userDoc.data() || { level: 1, xp: 0 };

                const currentLevel = data.level || 1;
                const currentXp = data.xp || 0;

                // To calculate rank, we check how many users have more XP
                const rankSnapshot = await db.collection('users')
                    .where('xp', '>', currentXp)
                    .count()
                    .get();
                const rank = rankSnapshot.data().count + 1;

                // Generate the card showing a hypothetical level up from their current level
                const imageUrl = await createLevelUpCard(targetMember, currentLevel, currentLevel + 1, currentXp, rank);

                if (!imageUrl) {
                    throw new Error("Image generation failed.");
                }

                const embed = new EmbedBuilder()
                    .setColor('#00FF7F')
                    .setTitle(`Test Level-Up Card for ${targetUser.username}`)
                    .setDescription('This is what the level-up announcement card will look like based on their current stats.')
                    .setImage(imageUrl);

                await interaction.editReply({ embeds: [embed] });

            } catch (error) {
                console.error("Failed to generate test level up card:", error);
                await interaction.editReply({ embeds: [await createErrorEmbed(interaction, db, "Could not generate the test card due to an error.")] });
            }
        }
    },
};
