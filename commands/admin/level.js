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
        .addSubcommand(subcommand =>
            subcommand.setName('setxp')
                .setDescription("Set a user's total XP.")
                .addUserOption(option => option.setName('user').setDescription('The user to modify.').setRequired(true))
                .addIntegerOption(option => option.setName('amount').setDescription('The total amount of XP.').setRequired(true).setMinValue(0)))
        .addSubcommand(subcommand =>
            subcommand.setName('setlevel')
                .setDescription("Set a user's level (XP will be set to the minimum for that level).")
                .addUserOption(option => option.setName('user').setDescription('The user to modify.').setRequired(true))
                .addIntegerOption(option => option.setName('level').setDescription('The target level.').setRequired(true).setMinValue(0)))
        .addSubcommand(subcommand =>
            subcommand.setName('testcard')
                .setDescription("Generate a test level-up card for a user.")
                .addUserOption(option => option.setName('user').setDescription('The user to generate the card for.').setRequired(true))),

    async execute(interaction, db) {
        await interaction.deferReply({ ephemeral: true });
        const subcommand = interaction.options.getSubcommand();
        const targetUser = interaction.options.getUser('user');
        const userRef = db.collection('users').doc(`${interaction.guild.id}-${targetUser.id}`);

        if (targetUser.bot) {
            return interaction.editReply({ embeds: [await createErrorEmbed(interaction, db, "Bots do not participate in the leveling system.")] });
        }

        if (subcommand === 'setxp' || subcommand === 'setlevel') {
            const level = interaction.options.getInteger('level');
            const xp = interaction.options.getInteger('amount');
            let updateData = {};

            if (subcommand === 'setlevel') {
                updateData.level = level;
                updateData.xp = getXpForLevel(level > 0 ? level - 1 : 0);
            } else {
                updateData.xp = xp;
            }
            
            await userRef.set(updateData, { merge: true });
            return interaction.editReply({ embeds: [await createSuccessEmbed(interaction, db, `Successfully updated ${targetUser.username}'s stats.`)] });
        }

        if (subcommand === 'testcard') {
            try {
                const targetMember = await interaction.guild.members.fetch(targetUser.id);
                const userDoc = await userRef.get();
                const data = userDoc.data() || { level: 1, xp: 0 };
                const currentXp = data.xp || 0;

                // This query requires the Firestore index.
                const rankSnapshot = await db.collection('users')
                    .where('guildId', '==', interaction.guild.id)
                    .where('xp', '>', currentXp)
                    .count()
                    .get();
                const rank = rankSnapshot.data().count + 1;
                
                const imageUrl = await createLevelUpCard(targetMember, data.level || 1, (data.level || 1) + 1, currentXp, rank);
                if (!imageUrl) throw new Error("Image generation service failed.");

                const embed = new EmbedBuilder()
                    .setColor('#00FF7F')
                    .setTitle(`Test Level-Up Card for ${targetUser.username}`)
                    .setImage(imageUrl);

                await interaction.editReply({ embeds: [embed] });

            } catch (error) {
                console.error("Failed to generate test level up card:", error);
                await interaction.editReply({ embeds: [await createErrorEmbed(interaction, db, "Could not generate the test card. Please ensure the Firestore index has been created and is enabled.")] });
            }
        }
    },
};
