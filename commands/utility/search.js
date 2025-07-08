// commands/utility/search.js
const { SlashCommandBuilder } = require('discord.js');
const { getSearchResults } = require('../../utils/llm');
const { createGheeEmbed } = require('../../utils/embeds');

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('search')
        .setDescription('Searches the web for a query and provides a summary.')
        .addStringOption(option => option.setName('query').setDescription('What you want to search for.').setRequired(true)),
    
    async execute(interaction) {
        await interaction.deferReply();
        const query = interaction.options.getString('query');

        try {
            const resultText = await getSearchResults(query);
            const embed = createGheeEmbed(`🔎 Web Search Results`, `Here's what I found for **"${query}"**:\n\n${resultText}`);
            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Search command error:', error);
            await interaction.editReply({ content: "Something went wrong while I was searching. Try again." });
        }
    },
};
