// commands/economy/leaderboard.js
const { SlashCommandBuilder } = require('discord.js');
const { createGheeEmbed, createErrorEmbed } = require('../../utils/embeds');
const { FieldPath } = require('firebase-admin/firestore');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('See who is the biggest Ghee fiend on the server.')
        .addStringOption(option =>
            option.setName('category')
                .setDescription('The category to rank users by.')
                .setRequired(true)
                .addChoices(
                    { name: '💰 Spot Coins', value: 'spotCoins' },
                    { name: '📈 Level', value: 'level' },
                    { name: '💬 Chat XP', value: 'chatXp' },    // NEW
                    { name: '🎤 Voice XP', value: 'voiceXp' }     // NEW
                )),

    async execute(interaction, db) {
        await interaction.deferReply();
        const category = interaction.options.getString('category');
        const guildId = interaction.guild.id;

        try {
            const usersRef = db.collection('users');
            const snapshot = await usersRef
                .where(FieldPath.documentId(), '>=', guildId)
                .where(FieldPath.documentId(), '<', guildId + 'z')
                .orderBy(category, 'desc')
                .limit(10)
                .get();

            if (snapshot.empty) {
                return interaction.editReply({ embeds: [createErrorEmbed("No one's got any stats yet.")] });
            }

            let description = '';
            let rank = 1;
            snapshot.forEach(doc => {
                const data = doc.data();
                const username = data.username || 'An Unknown Fiend';
                let value;
                switch(category) {
                    case 'spotCoins': value = `🪙 ${(data.spotCoins || 0).toLocaleString()} SC`; break;
                    case 'level': value = `📈 Level ${data.level || 1}`; break;
                    case 'chatXp': value = `💬 ${(data.chatXp || 0).toLocaleString()} XP`; break;
                    case 'voiceXp': value = `🎤 ${(data.voiceXp || 0).toLocaleString()} XP`; break;
                }
                description += `**${rank}.** ${username} - ${value}\n`;
                rank++;
            });

            let title;
            switch(category) {
                case 'spotCoins': title = '💰 Top Ghee Tycoons'; break;
                case 'level': title = '📈 Top Level Grinders'; break;
                case 'chatXp': title = '💬 Top Chatters'; break;
                case 'voiceXp': title = '🎤 Top Voice Dwellers'; break;
            }
            const embed = createGheeEmbed(title, description);
            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error(`Error fetching leaderboard for guild ${guildId}:`, error);
            await interaction.editReply({ embeds: [createErrorEmbed('Could not fetch the leaderboard.')] });
        }
    },
};