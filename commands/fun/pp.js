// commands/fun/pp.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { OWNER_IDS } = require('../../config');
const { createPPCard } = require('../../utils/imageGenerator');

function getSeededRandom(seed) {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

module.exports = {
    category: 'fun',
    data: new SlashCommandBuilder()
        .setName('pp')
        .setDescription('Measure your... potential power. (API Edition)')
        .addUserOption(option => option.setName('user').setDescription('The user to measure')),

    async execute(interaction) {
        await interaction.deferReply();
        const targetUser = interaction.options.getUser('user') || interaction.user;

        const timeSeed = Math.floor(Date.now() / (1000 * 60 * 60 * 12));
        const combinedSeed = parseInt(targetUser.id.slice(-6)) + timeSeed;
        
        const size = OWNER_IDS.includes(targetUser.id) ? 12 : Math.floor(getSeededRandom(combinedSeed) * 11) + 1;
        
        try {
            // The generator now returns a URL to the image
            const imageUrl = await createPPCard(targetUser, size);
            if (!imageUrl) throw new Error("API did not return a valid image URL.");

            // We create an embed and put the user's avatar in the thumbnail,
            // and the generated card as the main image.
            const embed = new EmbedBuilder()
                .setColor('#23272A')
                .setThumbnail(targetUser.displayAvatarURL())
                .setImage(imageUrl);

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error("Failed to create PP card via API:", error);
            await interaction.editReply("Sorry, the image generation service is down. Couldn't create your card.");
        }
    },
};
