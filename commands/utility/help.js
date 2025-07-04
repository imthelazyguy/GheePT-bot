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
        const adminCommands = [];

        commands.forEach(cmd => {
            if (!cmd.category) return;
            if (cmd.category === 'admin') {
                adminCommands.push(cmd);
                return;
            }
            const categoryCommands = categories.get(cmd.category) || [];
            categoryCommands.push(cmd);
            categories.set(cmd.category, categoryCommands);
        });

        const overviewEmbed = createGheeEmbed("GheePT's Command Manual", "Select a category from the dropdown menu to see what kind of chaos we can cause together.");
        
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('help_category_select')
            .setPlaceholder('Choose a category...')
            .addOptions(Array.from(categories.keys()).map(cat => ({ label: cat.charAt(0).toUpperCase() + cat.slice(1), value: cat })));

        const components = [new ActionRowBuilder().addComponents(selectMenu)];

        // Add admin button only if the user is an administrator
        if (interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            components[0].addComponents(new ButtonBuilder().setCustomId('help_admin_cmds').setLabel('Admin Commands').setStyle(ButtonStyle.Danger));
        }

        const message = await interaction.editReply({ embeds: [overviewEmbed], components });
        
        const collector = message.createMessageComponentCollector({ filter: i => i.user.id === interaction.user.id, time: 5 * 60 * 1000 });

        collector.on('collect', async i => {
            let embed;
            let title;
            let commandList;

            if (i.isStringSelectMenu()) {
                const selectedCategory = i.values[0];
                title = `Category: ${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}`;
                commandList = categories.get(selectedCategory);
            } else if (i.isButton() && i.customId === 'help_admin_cmds') {
                title = `🚨 Admin Commands`;
                commandList = adminCommands;
            }

            if(title && commandList) {
                embed = createGheeEmbed(title, "Here's what I can do.").addFields(commandList.map(cmd => ({ name: `/${cmd.data.name}`, value: cmd.data.description })));
                await i.update({ embeds: [embed] });
            }
        });

        collector.on('end', () => message.edit({ components: [] }).catch(console.error));
    },
};
