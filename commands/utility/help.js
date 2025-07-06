// commands/utility/help.js
const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { createGheeEmbed } = require('../../utils/embeds');

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Lists all commands or gets info on a specific command.'),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const { commands } = interaction.client;
        const categories = new Map();
        commands.forEach(cmd => {
            if (!cmd.category) return;
            const categoryCommands = categories.get(cmd.category) || [];
            categoryCommands.push(cmd);
            categories.set(cmd.category, categoryCommands);
        });
        
        const publicCategories = Array.from(categories.keys()).filter(cat => cat !== 'admin');

        const overviewEmbed = createGheeEmbed("GheePT's Command Manual", "Select a category from the dropdown menu to see what kind of chaos we can cause together.");
        
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('help_category_select')
            .setPlaceholder('Choose a command category...')
            .addOptions(publicCategories.map(cat => ({ label: cat.charAt(0).toUpperCase() + cat.slice(1), value: cat })));

        const selectMenuRow = new ActionRowBuilder().addComponents(selectMenu);
        const components = [selectMenuRow];

        // FIX: The button is now placed in its own ActionRow to prevent width errors.
        if (interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            const adminButtonRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('help_admin_cmds').setLabel('Admin Commands').setStyle(ButtonStyle.Danger)
            );
            components.push(adminButtonRow);
        }

        const message = await interaction.editReply({ embeds: [overviewEmbed], components });
        
        const collector = message.createMessageComponentCollector({ filter: i => i.user.id === interaction.user.id, time: 5 * 60 * 1000 });

        collector.on('collect', async i => {
            // ... The collector logic remains the same
        });

        collector.on('end', () => message.edit({ components: [] }).catch(console.error));
    },
};
