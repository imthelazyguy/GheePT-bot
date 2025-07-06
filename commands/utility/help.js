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

        const overviewEmbed = createGheeEmbed("GheePT's Command Manual", "Select a category from the dropdown menu to see what I can do. Admins will see a special button for restricted commands.");
        
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('help_category_select')
            .setPlaceholder('Choose a command category...')
            .addOptions(publicCategories.map(cat => ({ 
                label: cat.charAt(0).toUpperCase() + cat.slice(1), 
                value: cat 
            })));

        const selectMenuRow = new ActionRowBuilder().addComponents(selectMenu);
        const components = [selectMenuRow];

        if (interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            const adminButtonRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('help_admin_cmds').setLabel('Admin Commands').setStyle(ButtonStyle.Danger)
            );
            components.push(adminButtonRow);
        }

        const message = await interaction.editReply({ embeds: [overviewEmbed], components });
        
        const collector = message.createMessageComponentCollector({ 
            filter: i => i.user.id === interaction.user.id, 
            time: 5 * 60 * 1000
        });

        collector.on('collect', async i => {
            let commandList;
            let title;

            if (i.isButton() && i.customId === 'help_admin_cmds') {
                title = '🚨 Admin Commands';
                commandList = categories.get('admin');
            } else if (i.isStringSelectMenu()) {
                const selectedCategory = i.values[0];
                title = `Category: ${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}`;
                commandList = categories.get(selectedCategory);
            }

            if (commandList) {
                const embed = createGheeEmbed(title, "Here are the commands in this category:")
                    .addFields(commandList.map(cmd => ({ 
                        name: `/${cmd.data.name}`, 
                        value: cmd.data.description 
                    })));
                await i.update({ embeds: [embed] });
            }
        });

        collector.on('end', () => message.edit({ components: [] }).catch(console.error));
    },
};
