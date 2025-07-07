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
        // ... (subcommands remain the same) ...
        .addSubcommand(subcommand =>
            subcommand.setName('testcard')
                .setDescription("Generate a test level-up card for a user.")
                .addUserOption(option => option.setName('user').setDescription('The user to generate the card for.').setRequired(true))),

    async execute(interaction, db) {
        await interaction.deferReply({ ephemeral: true });
        const subcommand = interaction.options.getSubcommand();
        const targetUser = interaction.options.getUser('user');
        const userRef = db.collection('users').doc(`${interaction.guild.id}-${targetUser.id}`);

        // ... (setxp and setlevel logic remains the same) ...

        if (subcommand === 'testcard') {
            try {
                const targetMember = await interaction.guild.members.fetch(targetUser.id);
                const userDoc = await userRef.get();
                const data = userDoc.data() || { level: 1, xp: 0 };

                const currentLevel = data.level || 1;
                const currentXp = data.xp || 0;

                // FIX: This query now uses the index you just created.
                const rankSnapshot = await db.collection('users')
                    .where('guildId', '==', interaction.guild.id)
                    .where('xp', '>', currentXp)
                    .count()
                    .get();
                const rank = rankSnapshot.data().count + 1;

                const imageUrl = await createLevelUpCard(targetMember, currentLevel, currentLevel + 1, currentXp, rank);

                if (!imageUrl) {
                    throw new Error("The image generation service returned nothing.");
                }

                const embed = new EmbedBuilder()
                    .setColor('#00FF7F')
                    .setTitle(`Test Level-Up Card for ${targetUser.username}`)
                    .setImage(imageUrl);

                await interaction.editReply({ embeds: [embed] });

            } catch (error) {
                console.error("Failed to generate test level up card:", error);
                await interaction.editReply({ embeds: [await createErrorEmbed(interaction, db, "Could not generate the test card. Make sure the Firestore index has been created.")] });
            }
        }
    },
};
