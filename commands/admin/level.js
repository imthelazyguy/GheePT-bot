// commands/admin/level.js
const { SlashCommandBuilder, PermissionFlagsBits, AttachmentBuilder } = require('discord.js');
const { Rank } = require('canvacord');
const path = require('path');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');
const { getXpForLevel } = require('../../utils/leveling');

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
            // This logic is unchanged
            // ...
        }

        if (subcommand === 'testcard') {
            try {
                const targetMember = await interaction.guild.members.fetch(targetUser.id);
                const userDoc = await userRef.get();
                const data = userDoc.data() || { level: 1, xp: 0, chatXp: 0, voiceXp: 0 };

                const currentLevel = data.level || 1;
                const totalXP = (data.chatXp || 0) + (data.voiceXp || 0);
                const xpForNextLevel = getXpForLevel(currentLevel);

                // This is the query that requires the index.
                const rankSnapshot = await db.collection('users')
                    .where('guildId', '==', interaction.guild.id)
                    .where('xp', '>', totalXP) // Note: A more accurate rank would use totalXP, but this requires another index.
                    .count()
                    .get();
                const rank = rankSnapshot.data().count + 1;

                const backgroundPath = path.join(__dirname, '../../assets/card-bg.png');
                
                // Build the card using canvacord
                const card = new Rank()
                    .setUsername(targetUser.username)
                    .setDiscriminator(targetUser.discriminator)
                    .setAvatar(targetUser.displayAvatarURL({ extension: 'png' }))
                    .setCurrentXP(totalXP)
                    .setRequiredXP(xpForNextLevel)
                    .setLevel(currentLevel + 1, "LEVEL") // Show the NEW level they would reach
                    .setRank(rank, "RANK")
                    .setStatus(targetMember.presence?.status || 'offline', true, 5)
                    .setProgressBar('#00FF7F', 'COLOR') // A nice green for level ups
                    .setBackground('IMAGE', backgroundPath)
                    .addXP('chat', data.chatXp || 0)
                    .addXP('voice', data.voiceXp || 0);

                const cardBuffer = await card.build();
                const attachment = new AttachmentBuilder(cardBuffer, { name: 'levelup-test-card.png' });

                await interaction.editReply({ content: 'Here is a preview of the level-up card:', files: [attachment] });

            } catch (error) {
                console.error("Failed to generate test level up card:", error);
                await interaction.editReply({ embeds: [await createErrorEmbed(interaction, db, "Could not generate the test card. Please ensure the Firestore index has been created and is fully enabled.")] });
            }
        }
    },
};
