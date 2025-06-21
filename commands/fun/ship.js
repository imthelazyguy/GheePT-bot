// commands/fun/ship.js
const { SlashCommandBuilder } = require('discord.js');
const { createGheeEmbed } = require('../../utils/embeds');

function getSeededRandom(seed) {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ship')
        .setDescription('Calculates the compatibility between two users.')
        .addUserOption(option => option.setName('user1').setDescription('The first user').setRequired(true))
        .addUserOption(option => option.setName('user2').setDescription('The second user').setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();
        const user1 = interaction.options.getUser('user1');
        const user2 = interaction.options.getUser('user2');

        if (user1.id === user2.id) {
            return interaction.editReply({ embeds: [createGheeEmbed('Self-Love ❤️', 'Shipping yourself? That\'s a 100% match, obviously.')] });
        }

        // Create a static seed from both user IDs. Sort them to ensure ship(A,B) == ship(B,A). 
        const ids = [user1.id, user2.id].sort();
        const combinedSeed = parseInt(ids[0].slice(-4)) + parseInt(ids[1].slice(-5));
        
        const percentage = Math.floor(getSeededRandom(combinedSeed) * 101);
        
        let duo;
        if (percentage < 10) duo = "a perfectly spiced biryani and a forgotten spoon.";
        else if (percentage < 30) duo = "a rickshaw and a runway model.";
        else if (percentage < 60) duo = "a vada pav and extra chutney.";
        else if (percentage < 85) duo = "chai and Parle-G.";
        else duo = "Raj and Simran. Go get a room!";

        const responseMessage = `GheePT's 'Match-Making Masala' has brewed a compatibility score of **${percentage}%** for **${user1.username}** and **${user2.username}**!\n\nThey're like ${duo}`; // 

        const embed = createGheeEmbed('💕 Match-Making Masala', responseMessage);
        await interaction.editReply({ embeds: [embed] });
    },
};