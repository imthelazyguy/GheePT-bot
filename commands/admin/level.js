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
        // ... (subcommands remain the same)
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
            // ...
        }

        if (subcommand === 'setxp' || subcommand === 'setlevel') {
            // ... (this logic remains the same)
        }

        if (subcommand === 'testcard') {
            try {
                const targetMember = await interaction.guild.members.fetch(targetUser.id);
                const userDoc = await userRef.get();
                const data = userDoc.data() || { level: 1, chatXp: 0, voiceXp: 0 };

                const currentLevel = data.level || 1;
                const chatXp = data.chatXp || 0;
                const voiceXp = data.voiceXp || 0;
                const totalXP = chatXp + voiceXp;
                const xpForNextLevel = getXpForLevel(currentLevel);

                // --- FIX: This new method for calculating rank does NOT require an index ---
                const allUsersSnapshot = await db.collection('users').where('guildId', '==', interaction.guild.id).get();
                const sortedUsers = allUsersSnapshot.docs
                    .map(d => ({ id: d.id, xp: (d.data().chatXp || 0) + (d.data().voiceXp || 0) }))
                    .sort((a, b) => b.xp - a.xp);
                const rank = sortedUsers.findIndex(p => p.id === `${interaction.guild.id}-${targetUser.id}`) + 1 || allUsersSnapshot.size;

                const backgroundPath = path.join(__dirname, '../../assets/card-bg.png');
                
                const card = new Rank()
                    .setUsername(targetUser.username)
                    .setDiscriminator(targetUser.discriminator)
                    .setAvatar(targetUser.displayAvatarURL({ extension: 'png' }))
                    .setCurrentXP(totalXP)
                    .setRequiredXP(xpForNextLevel)
                    .setLevel(currentLevel, "LEVEL") // Show their current level
                    .setRank(rank, "RANK")
                    .setStatus(targetMember.presence?.status || 'offline', true, 5)
                    .setProgressBar('#00FF7F', 'COLOR')
                    .setBackground('IMAGE', backgroundPath);

                const cardBuffer = await card.build();
                const attachment = new AttachmentBuilder(cardBuffer, { name: 'levelup-test-card.png' });

                await interaction.editReply({ 
                    content: `**Chat XP:** ${chatXp.toLocaleString()} | **Voice XP:** ${voiceXp.toLocaleString()}\nHere is a preview of the rank card:`, 
                    files: [attachment] 
                });

            } catch (error) {
                console.error("Failed to generate test level up card:", error);
                await interaction.editReply({ embeds: [await createErrorEmbed(interaction, db, "Could not generate the test card.")] });
            }
        }
    },
};
