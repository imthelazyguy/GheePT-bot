// commands/fun/gay.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { createAttributeCard } = require('../../utils/imageGenerator');

function getSeededRandom(seed) {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

module.exports = {
    category: 'fun',
    data: new SlashCommandBuilder()
        .setName('gay')
        .setDescription('Calculates a user\'s gayness.')
        .addUserOption(option => option.setName('user').setDescription('The user to check')),

    async execute(interaction) {
        await interaction.deferReply();
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const timeSeed = Math.floor(Date.now() / (1000 * 60 * 60 * 12));
        const combinedSeed = parseInt(targetUser.id.slice(-6)) + timeSeed;
        const percentage = Math.round(getSeededRandom(combinedSeed) * 100);
        
        try {
            const imageUrl = await createAttributeCard('Rainbow Radar', `${percentage}% Fabulous`, percentage, targetUser.displayAvatarURL({ extension: 'png', size: 128 }));
            if (!imageUrl) throw new Error("API did not return a valid image URL.");
            const embed = new EmbedBuilder().setColor('#FFD700').setImage(imageUrl);
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error("Failed to create Gay card via API:", error);
            await interaction.editReply({ embeds: [createErrorEmbed("My image generator is being a diva. Try again later.")] });
        }
    },
};
