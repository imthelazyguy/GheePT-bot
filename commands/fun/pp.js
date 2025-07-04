// commands/fun/pp.js
const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
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
        .setDescription('Measure your... potential power. (Image Edition)')
        .addUserOption(option => option.setName('user').setDescription('The user to measure')),

    async execute(interaction) {
        await interaction.deferReply();
        const targetUser = interaction.options.getUser('user') || interaction.user;

        const timeSeed = Math.floor(Date.now() / (1000 * 60 * 60 * 12));
        const combinedSeed = parseInt(targetUser.id.slice(-6)) + timeSeed;
        
        const size = OWNER_IDS.includes(targetUser.id) ? 12 : Math.floor(getSeededRandom(combinedSeed) * 11) + 1;
        
        try {
            const imageBuffer = await createPPCard(targetUser, size);
            const attachment = new AttachmentBuilder(imageBuffer, { name: 'pp-card.png' });
            await interaction.editReply({ files: [attachment] });
        } catch (error) {
            console.error("Failed to create PP card:", error);
            await interaction.editReply("Sorry, my canvas exploded. Couldn't draw your card.");
        }
    },
};
