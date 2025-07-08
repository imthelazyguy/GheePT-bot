// commands/utility/rank.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getXpForLevel } = require('../../utils/leveling');
const fetch = require('node-fetch');

// This function builds the URL for the QuickChart API to generate our card
async function createRankCardUrl(user, member, rankData) {
    const { level, totalXP, neededXp, rank, chatXp, voiceXp } = rankData;
    
    // Calculate progress bar percentage
    const xpForLastLevel = getXpForLevel(level - 1);
    const xpInCurrentLevel = totalXP - xpForLastLevel;
    const requiredForThisLevel = neededXp - xpForLastLevel;
    const percentage = Math.max(0, Math.min(100, (xpInCurrentLevel / requiredForThisLevel) * 100));

    // IMPORTANT: You must upload your 'card-bg.png' to a host like Imgur and paste the direct link here.
    const backgroundImageUrl = 'https://imgur.com/a/6OLEewB'; // <-- PASTE YOUR IMAGE URL HERE

    const chartConfig = {
        type: 'bar',
        data: {
            labels: [''],
            datasets: [{ data: [percentage], backgroundColor: '#2bdac7', borderWidth: 0, barPercentage: 1, borderRadius: 20 }]
        },
        options: {
            plugins: {
                datalabels: { display: false },
                chartJsPluginAnnotation: {
                    annotations: [
                        // Username & Status
                        { type: 'label', content: `${user.username}#${user.discriminator}`, font: { size: 36, family: 'sans-serif', weight: 'bold' }, color: '#FFFFFF', position: { x: '270px', y: '50px' } },
                        // Rank & Level
                        { type: 'label', content: `Rank: #${rank}`, font: { size: 28, family: 'sans-serif', weight: 'bold' }, color: '#FFFFFF', position: { x: '850px', y: '60px' } },
                        { type: 'label', content: `Level: ${level}`, font: { size: 28, family: 'sans-serif', weight: 'bold' }, color: '#FFFFFF', position: { x: '850px', y: '110px' } },
                        // XP Text
                        { type: 'label', content: `${totalXP.toLocaleString()} / ${neededXp.toLocaleString()} XP`, font: { size: 24, family: 'sans-serif' }, color: '#B9BBBE', position: { x: '850px', y: '190px' }, xAdjust: -10 },
                        // XP Breakdown
                        { type: 'label', content: `Chat: ${chatXp.toLocaleString()} | Voice: ${voiceXp.toLocaleString()}`, font: { size: 20, family: 'sans-serif' }, color: '#B9BBBE', position: { x: '450px', y: '130px' } }
                    ]
                }
            },
            chartArea: {
                // This layers the background and avatar
                backgroundColor: [
                    { image: backgroundImageUrl },
                    { image: user.displayAvatarURL({ extension: 'png', size: 256 }), x: '40px', y: '40px', width: 200, height: 200, drawTime: 'beforeDatasetsDraw' }
                ]
            },
            layout: { padding: { left: 260, right: 30, top: 20, bottom: 20 } },
            scales: { x: { display: false, min: 0, max: 100 }, y: { display: false } },
            legend: { display: false },
        }
    };
    
    // We encode the config and create the final URL
    const encodedConfig = encodeURIComponent(JSON.stringify(chartConfig));
    return `https://quickchart.io/chart?width=934&height=282&c=${encodedConfig}`;
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

        if (user.bot) return interaction.editReply("Bots don't have ranks, they have existential dread.");

        try {
            const userRef = db.collection('users').doc(`${interaction.guild.id}-${user.id}`);
            const doc = await userRef.get();
            const data = doc.data() || { level: 1, chatXp: 0, voiceXp: 0 };
            
            const totalXP = (data.chatXp || 0) + (data.voiceXp || 0);

            const allUsersSnapshot = await db.collection('users').where('guildId', '==', interaction.guild.id).get();
            const sortedUsers = allUsersSnapshot.docs
                .map(d => ({ id: d.id, xp: (d.data().xp || 0) }))
                .sort((a, b) => b.xp - a.xp);
            const rank = sortedUsers.findIndex(p => p.id === `${interaction.guild.id}-${user.id}`) + 1 || allUsersSnapshot.size;

            const rankData = {
                level: data.level || 1,
                totalXP: totalXP,
                neededXp: getXpForLevel(data.level || 1),
                rank: rank,
                chatXp: data.chatXp || 0,
                voiceXp: data.voiceXp || 0
            };
            
            const member = await interaction.guild.members.fetch(user.id);
            const imageUrl = await createRankCardUrl(user, member, rankData);
            
            const embed = new EmbedBuilder()
                .setColor('#2bdac7')
                .setAuthor({ name: `${user.username}'s Rank Card`, iconURL: user.displayAvatarURL() })
                .setImage(imageUrl);

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error("Rank command failed:", error);
            await interaction.editReply({ content: "My circuits are fried. Couldn't generate the rank card." });
        }
    },
};
