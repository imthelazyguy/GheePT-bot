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

        // Static seed based on both user IDs for a consistent result
        const combinedId = BigInt(user1.id) + BigInt(user2.id);
        const seed = parseInt(combinedId.toString().slice(-9));
        let x = Math.sin(seed) * 10000;
        const percentage = Math.round((x - Math.floor(x)) * 100);

        try {
            const imageUrl = await createShipCard(user1, user2, percentage);
            if (!imageUrl) throw new Error("API did not return a valid image URL.");

            const embed = new EmbedBuilder()
                .setColor('#FF4560')
                .setTitle(`Shipping ${user1.username} & ${user2.username}`)
                .setImage(imageUrl)
                .setThumbnail(user1.displayAvatarURL())
                .addFields({ name: '\u200B', value: `<@${user2.id}>`, inline: true });

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error("Failed to create Ship card via API:", error);
            await interaction.editReply({ embeds: [createErrorEmbed("My love-o-meter is broken. Try shipping later.")] });
        }
    },
};
