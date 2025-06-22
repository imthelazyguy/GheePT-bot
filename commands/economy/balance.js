// commands/economy/balance.js
const { SlashCommandBuilder } = require('discord.js');
const { createGheeEmbed, createErrorEmbed } = require('../../utils/embeds');
const { getXpForNextLevel } = require('../../utils/leveling');

module.exports = {
    category: 'economy',
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription("Check your or another user's core stats.")
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to check the balance of.')
                .setRequired(false)),

    async execute(interaction, db) {
        await interaction.deferReply();

        try {
            const targetUser = interaction.options.getUser('user') || interaction.user;
            if (targetUser.bot) {
                return interaction.editReply({ embeds: [createErrorEmbed("Bots are beyond the concept of money and levels.")]});
            }

            const userDocRef = db.collection('users').doc(`${interaction.guild.id}-${targetUser.id}`);
            const userDoc = await userDocRef.get();

            const data = userDoc.data() || {};
            const spotCoins = data.spotCoins || 0;
            const level = data.level || 1;
            const chatXp = data.chatXp || 0;
            const voiceXp = data.voiceXp || 0;
            const totalXp = chatXp + voiceXp;
            
            const xpForNext = getXpForNextLevel(level);

            const embed = createGheeEmbed(`📊 Stats for ${targetUser.username}`)
                .setThumbnail(targetUser.displayAvatarURL())
                .addFields(
                    { name: 'Spot Coins', value: `🪙 ${spotCoins.toLocaleString()}`, inline: true },
                    { name: 'Level', value: `📈 ${level}`, inline: true },
                    { name: 'XP Progress', value: `⚡ ${totalXp.toLocaleString()} / ${xpForNext.toLocaleString()}`, inline: false }
                );

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error(`Error fetching balance for user ${interaction.user.id}:`, error);
            await interaction.editReply({ embeds: [createErrorEmbed('Could not fetch the balance due to a database error.')] });
        }
    },
};
