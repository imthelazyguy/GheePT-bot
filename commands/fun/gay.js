// commands/fun/gay.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { generateProgressBar } = require('../../utils/cardGenerator');

function getSeededRandom(seed) { let x = Math.sin(seed) * 10000; return x - Math.floor(x); }

module.exports = {
    category: 'fun',
    data: new SlashCommandBuilder()
        .setName('gay')
        .setDescription("Calculates a user's gayness level for the day.")
        .addUserOption(option => option.setName('user').setDescription('The user to check')),

    async execute(interaction) {
        await interaction.deferReply();
        const targetUser = interaction.options.getUser('user') || interaction.user;

        const timeSeed = Math.floor(Date.now() / (1000 * 60 * 60 * 12));
        const combinedSeed = parseInt(targetUser.id.slice(-5)) + timeSeed; // Use a different slice for a different result
        const percentage = Math.round(getSeededRandom(combinedSeed) * 100);

        const progressBar = generateProgressBar(percentage, 10, '🌈', '🖤');
        
        const embed = new EmbedBuilder()
            .setColor('#FF69B4')
            .setAuthor({ name: `Rainbow Radar: ${targetUser.username}`, iconURL: targetUser.displayAvatarURL() })
            .addFields(
                { name: 'Fabulousness', value: `${percentage}%` },
                { name: 'Vibe Meter', value: `${progressBar}` }
            )
            .setFooter({ text: "GheePT's 'Rainbow Rader' pings you at Werk it."});

        await interaction.editReply({ embeds: [embed] });
    },
};
