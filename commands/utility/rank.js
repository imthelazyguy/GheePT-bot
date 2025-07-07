// commands/utility/rank.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getXpForLevel } = require('../../utils/leveling');

// This function creates a progress bar out of emojis.
function generateProgressBar(current, required, length = 10) {
    const percentage = current / required;
    const progress = Math.round(length * percentage);
    const empty = length - progress;
    if (progress + empty !== length) { // Sanity check
        return '▰'.repeat(length);
    }
    return '▰'.repeat(progress) + '▱'.repeat(empty);
}

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription("Checks your server rank. Flex on 'em.")
        .addUserOption(option => option.setName('user').setDescription('The user whose rank card to view.')),

    async execute(interaction, db) {
        await interaction.deferReply();

        const user = interaction.options.getUser('user') || interaction.user;
        if (user.bot) {
            return interaction.editReply("Bots don't have ranks, they have existential dread.");
        }

        const guildId = interaction.guild.id;
        const userId = user.id;

        try {
            // Fetch user data
            const userRef = db.collection('users').doc(`${guildId}-${userId}`);
            const doc = await userRef.get();

            let level = 1, chatXp = 0, voiceXp = 0;
            if (doc.exists) {
                const data = doc.data();
                level = data.level || 1;
                chatXp = data.chatXp || 0;
                voiceXp = data.voiceXp || 0;
            }
            
            const totalXP = chatXp + voiceXp;
            const neededXp = getXpForLevel(level);

            // Calculate Rank
            const allUsersSnapshot = await db.collection('users').where('guildId', '==', guildId).get();
            const sortedUsers = allUsersSnapshot.docs
                .map(d => ({ id: d.id, xp: (d.data().chatXp || 0) + (d.data().voiceXp || 0) }))
                .sort((a, b) => b.xp - a.xp);
            const rank = sortedUsers.findIndex(p => p.id === `${guildId}-${userId}`) + 1 || allUsersSnapshot.size;

            const progressBar = generateProgressBar(totalXP, neededXp, 15);
            
            const rankEmbed = new EmbedBuilder()
                .setColor('#2bdac7')
                .setAuthor({ name: `${user.username}'s Server Rank`, iconURL: user.displayAvatarURL() })
                .setThumbnail(user.displayAvatarURL())
                .addFields(
                    { name: 'Rank', value: `\`#${rank}\``, inline: true },
                    { name: 'Level', value: `\`${level}\``, inline: true },
                    { name: 'Total XP', value: `\`${totalXP.toLocaleString()}\``, inline: true },
                    { name: 'XP Breakdown', value: `💬 Chat: \`${chatXp.toLocaleString()}\` | 🎤 Voice: \`${voiceXp.toLocaleString()}\``},
                    { name: 'Level Progress', value: `\`${totalXP.toLocaleString()} / ${neededXp.toLocaleString()}\`\n${progressBar}` }
                );

            await interaction.editReply({ embeds: [rankEmbed] });

        } catch (error) {
            console.error("Rank command failed:", error);
            await interaction.editReply({ content: "My abacus broke trying to calculate the rank. Try again later." });
        }
    },
};
