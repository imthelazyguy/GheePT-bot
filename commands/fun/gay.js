// commands/fun/gay.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { createAttributeCard } = require('../../utils/imageGenerator');

function getSeededRandom(seed) { let x = Math.sin(seed) * 10000; return x - Math.floor(x); }

module.exports = {
    category: 'fun',
    data: new SlashCommandBuilder()
        .setName('gay')
        .setDescription("Calculates a user's gayness.")
        .addUserOption(option => option.setName('user').setDescription('The user to check')),
    async execute(interaction) {
        await interaction.deferReply();
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const timeSeed = Math.floor(Date.now() / (1000 * 60 * 60 * 12));
        const combinedSeed = parseInt(targetUser.id.slice(-6)) + timeSeed;
        const percentage = Math.round(getSeededRandom(combinedSeed) * 100);

        try {
            const imageUrl = await createAttributeCard("Rainbow Radar", `${percentage}% Fabulous`, percentage);
            if (!imageUrl) throw new Error("API did not return a valid image URL.");
            const embed = new EmbedBuilder()
                .setColor('#FF69B4')
                .setAuthor({ name: `${targetUser.username}'s Gaydar Reading`, iconURL: targetUser.displayAvatarURL() })
                .setImage(imageUrl);
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: "Sorry, the image generator is being a diva. Try again later." });
        }
    },
};
