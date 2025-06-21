// commands/utility/help.js
const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { createGheeEmbed, createErrorEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Lists all my commands or gets info on a specific command. Don\'t get lost.'),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const { commands } = interaction.client;
        const categories = new Map();

        // Group commands by category, excluding admin commands
        commands.forEach(cmd => {
            if (!cmd.category || cmd.category === 'admin') return;
            const categoryCommands = categories.get(cmd.category) || [];
            categoryCommands.push(cmd);
            categories.set(cmd.category, categoryCommands);
        });

        // SAFEGUARD: This check prevents the crash if no categories are found.
        if (categories.size === 0) {
            console.error("[HELP COMMAND] No command categories were found. Check the command loader in index.js.");
            return interaction.editReply({ embeds: [createErrorEmbed("I couldn't find any commands to show you. This is likely a bot configuration error.")] });
        }

        const overviewEmbed = createGheeEmbed(
            "GheePT's Command Manual",
            "Ya lost, kid? Don't worry, I got you. I'm like, a genius or whatever.\n\nSelect a category from the dropdown menu below to see what kind of chaos we can cause together."
        );

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('help_category_select')
            .setPlaceholder('Choose a category...')
            .addOptions(
                Array.from(categories.keys()).map(category => ({
                    label: category.charAt(0).toUpperCase() + category.slice(1),
                    value: category,
                }))
            );

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const message = await interaction.editReply({
            embeds: [overviewEmbed],
            components: [row],
        });

        const collector = message.createMessageComponentCollector({
            filter: i => i.user.id === interaction.user.id,
            time: 5 * 60 * 1000,
        });

        collector.on('collect', async i => {
            if (i.isStringSelectMenu()) {
                const selectedCategory = i.values[0];
                const commandsInCategory = categories.get(selectedCategory);

                const categoryEmbed = createGheeEmbed(
                    `Category: ${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}`,
                    "Here's what I can do in this category. Try not to break anything."
                ).addFields(
                    commandsInCategory.map(cmd => ({
                        name: `/${cmd.data.name}`,
                        value: cmd.data.description,
                    }))
                );

                await i.update({ embeds: [categoryEmbed] });
            }
        });

        collector.on('end', () => {
            message.edit({ components: [] }).catch(console.error);
        });
    },
};