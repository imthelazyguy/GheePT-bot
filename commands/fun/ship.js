// commands/fun/ship.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { createShipCard } = require('../../utils/imageGenerator');

module.exports = {
    category: 'fun',
    data: new SlashCommandBuilder()
        .setName('ship')
        .setDescription('Calculates the compatibility between two users.')
        .addUserOption(option => option.setName('user1').setDescription('The first person.').setRequired(true))
        .addUserOption(option => option.setName('user2').setDescription('The second person.').setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();
        const user1 = interaction.options.getUser('user1');
        const user2 = interaction.options.getUser('user2');

        const ids = [user1.id, user2.id].sort();
        const combinedSeed = parseInt(ids[0].slice(-5)) + parseInt(ids[1].slice(-5));
        let x = Math.sin(combinedSeed) * 10000;
        const percentage = Math.round((x - Math.floor(x)) * 100);

        try {
            const imageUrl = await createShipCard(percentage);
            if (!imageUrl) throw new Error("API did not return a valid image URL.");
            const embed = new EmbedBuilder()
                .setColor('#FF4560')
                .setTitle(`Shipping ${user1.username} ❤️ ${user2.username}`)
                .setDescription('**Compatibility Score:**')
                .setImage(imageUrl);
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.editReply({ embeds: [createGheeEmbed('Error', 'My love-o-meter is broken. Try shipping later.')]});
        }
    },
};
