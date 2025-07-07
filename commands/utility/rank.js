// commands/utility/rank.js
const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { Rank } = require('canvacord');
const path = require('path');
const { getXpForLevel } = require('../../utils/leveling'); // Using our existing leveling utility

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
            // Fetch user data from our existing Firestore structure
            const userRef = db.collection('users').doc(`${guildId}-${userId}`);
            const doc = await userRef.get();

            let level = 1, chatXp = 0, voiceXp = 0, coins = 0;

            if (doc.exists) {
                const data = doc.data();
                level = data.level || 1;
                chatXp = data.chatXp || 0;
                voiceXp = data.voiceXp || 0;
                coins = data.spotCoins || 0;
            }
            
            const totalXP = chatXp + voiceXp;
            const neededXp = getXpForLevel(level);

            // Fetch all users to calculate rank
            const snapshot = await db.collection('users').where('guildId', '==', guildId).orderBy('xp', 'desc').get();
            const players = snapshot.docs.map(d => d.id);
            const rank = players.indexOf(`${guildId}-${userId}`) + 1 || snapshot.size + 1;

            const member = await interaction.guild.members.fetch(userId);
            const status = member.presence?.status || 'offline';
            
            const backgroundPath = path.join(__dirname, '../../assets/card-bg.png');

            // Build the rank card using canvacord
            const card = new Rank()
                .setUsername(user.username)
                .setDiscriminator(user.discriminator)
                .setAvatar(user.displayAvatarURL({ extension: 'png' }))
                .setCurrentXP(totalXP)
                .setRequiredXP(neededXp)
                .setLevel(level)
                .setRank(rank, "RANK")
                .setStatus(status, true, 5)
                .setProgressBar('#2bdac7', 'COLOR')
                .setBackground('IMAGE', backgroundPath)
                .addXP('Chat XP', chatXp)
                .addXP('Voice XP', voiceXp);

            const data = await card.build();
            const attachment = new AttachmentBuilder(data, { name: 'gheept-rank-card.png' });

            await interaction.editReply({ files: [attachment] });

        } catch (error) {
            console.error("Rank card generation failed:", error);
            await interaction.editReply({ content: "My circuits are fried trying to calculate your vibe. Try again later." });
        }
    },
};
