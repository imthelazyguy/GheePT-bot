// commands/economy/balance.js
const { SlashCommandBuilder } = require('discord.js');
const { createGheeEmbed, createErrorEmbed } = require('../../utils/embeds');
const { getXpForNextLevel } = require('../../utils/leveling');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Check your or another user\'s balance and level.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to check the balance of.')
                .setRequired(false)),

    async execute(interaction, db) {
        await interaction.deferReply();

        try {
            const targetUser = interaction.options.getUser('user') || interaction.user;
            if (targetUser.bot) {
                return interaction.editReply({ embeds: [createErrorEmbed("Bots don't have bank accounts, silly.")]});
            }

            const guildId = interaction.guild.id;
            const userId = targetUser.id;
            const userDocRef = db.collection('users').doc(`${guildId}-${userId}`);

            const userDoc = await userDocRef.get();

            const data = userDoc.data() || {};
            const spotCoins = data.spotCoins || 0;
            const level = data.level || 1;
            const xp = data.xp || 0; // This can be deprecated if you only want to show chat/voice xp
            const xpForNext = getXpForNextLevel(level);

            const embed = createGheeEmbed(`💰 Balance for ${targetUser.username}`)
                .setThumbnail(targetUser.displayAvatarURL())
                .addFields(
                    { name: 'Spot Coins (SC)', value: `🪙 ${spotCoins.toLocaleString()}`, inline: true },
                    { name: 'Level', value: `📈 ${level}`, inline: true },
                    { name: 'Experience (XP)', value: `⚡ ${(data.chatXp || 0) + (data.voiceXp || 0)} / ${xpForNext.toLocaleString()}`, inline: false }
                );

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error(`Error fetching balance for user ${interaction.user.id}:`, error);
            await interaction.editReply({ embeds: [createErrorEmbed('Could not fetch the balance due to a database error.')] });
        }
    },
};