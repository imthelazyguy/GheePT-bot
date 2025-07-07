// commands/fun/pp.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { OWNER_IDS } = require('../../config');
const { generateProgressBar } = require('../../utils/cardGenerator');

function getSeededRandom(seed) { let x = Math.sin(seed) * 10000; return x - Math.floor(x); }

module.exports = {
    category: 'fun',
    data: new SlashCommandBuilder()
        .setName('pp')
        .setDescription('Measure your... potential power.')
        .addUserOption(option => option.setName('user').setDescription('The user to measure')),
    async execute(interaction) {
        await interaction.deferReply();
        const targetUser = interaction.options.getUser('user') || interaction.user;

        const timeSeed = Math.floor(Date.now() / (1000 * 60 * 60 * 12));
        const combinedSeed = parseInt(targetUser.id.slice(-6)) + timeSeed;
        const size = (OWNER_IDS || []).includes(targetUser.id) ? 12 : Math.floor(getSeededRandom(combinedSeed) * 11) + 1;
        const percentage = Math.round((size / 12) * 100);
        
        const progressBar = generateProgressBar(percentage, 10, '💖', '🖤');
        
        const embed = new EmbedBuilder()
            .setColor('#FF69B4')
            .setAuthor({ name: `${targetUser.username}'s PP Reading`, iconURL: targetUser.displayAvatarURL() })
            .addFields(
                { name: 'Size', value: `${size} inches` },
                { name: 'Meter', value: `**8=${progressBar}D**` }
            );

        await interaction.editReply({ embeds: [embed] });
    },
};
