// commands/fun/pp.js
const { SlashCommandBuilder } = require('discord.js');
const { createAttributeCard } = require('../../utils/imageGenerator');
const { OWNER_IDS } = require('../../config'); // Correctly import OWNER_IDS

function getSeededRandom(seed) {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

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
        
        // Check if the user ID is in the OWNER_IDS array from the config
        const size = (OWNER_IDS || []).includes(targetUser.id) ? 12 : Math.floor(getSeededRandom(combinedSeed) * 11) + 1;
        const percentage = Math.round((size / 12) * 100);

        try {
            const imageUrl = await createAttributeCard(`${targetUser.username}'s PP`, `${size} inches`, percentage, targetUser.displayAvatarURL({ extension: 'png', size: 128 }));
            if (!imageUrl) throw new Error("API did not return a valid image URL.");
            await interaction.editReply({ files: [{ attachment: imageUrl, name: 'card.png' }] });
        } catch (error) {
            console.error("Failed to create PP card via API:", error);
            await interaction.editReply("Sorry, the image generation service is down. Couldn't create your card.");
        }
    },
};
