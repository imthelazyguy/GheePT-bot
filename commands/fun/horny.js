// commands/fun/horny.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { generateProgressBar } = require('../../utils/cardGenerator');

function getSeededRandom(seed) { let x = Math.sin(seed) * 10000; return x - Math.floor(x); }

module.exports = {
    category: 'fun',
    data: new SlashCommandBuilder()
        .setName('horny')
        .setDescription("Checks a user's horniness level.")
        .addUserOption(option => option.setName('user').setDescription('The user to check')),

    async execute(interaction) {
        await interaction.deferReply();
        const targetUser = interaction.options.getUser('user') || interaction.user;

        const timeSeed = Math.floor(Date.now() / (1000 * 60 * 60 * 12));
        const combinedSeed = parseInt(targetUser.id.slice(-4)) + timeSeed;
        const percentage = Math.round(getSeededRandom(combinedSeed) * 100);

        const progressBar = generateProgressBar(percentage, 10, '🔥', '💧');

        const embed = new EmbedBuilder()
            .setColor('#DC143C')
            .setAuthor({ name: `Arousometer Reading: ${targetUser.username}`, iconURL: targetUser.displayAvatarURL() })
            .addFields(
                { name: 'Horny Level', value: `${percentage}%` },
                { name: 'Meter', value: `${progressBar}` }
            )
            .setFooter({ text: 'Please find a chill pill or a private channel.'});

        await interaction.editReply({ embeds: [embed] });
    },
};
