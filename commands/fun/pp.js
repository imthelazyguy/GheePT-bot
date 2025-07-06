// commands/fun/pp.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { createAttributeCard } = require('../../utils/imageGenerator');
const { OWNER_IDS } = require('../../config');

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

        try {
            const imageUrl = await createAttributeCard("PP Size", `${size} inches`, percentage);
            if (!imageUrl) throw new Error("API did not return a valid image URL.");
            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setAuthor({ name: `${targetUser.username}'s PP Reading`, iconURL: targetUser.displayAvatarURL() })
                .setImage(imageUrl);
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.editReply({ embeds: [createGheeEmbed('Error', 'My image generator is on a smoke break. Try again in a bit.')]});
        }
    },
};
