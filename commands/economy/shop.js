// commands/economy/shop.js
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createGheeEmbed, createErrorEmbed } = require('../../utils/embeds');

const ITEMS_PER_PAGE = 5;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('Displays items available for purchase with Spot Coins.'),

    async execute(interaction, db) {
        await interaction.deferReply();
        
        try {
            const itemsSnapshot = await db.collection('shop_items').orderBy('price').get();
            if (itemsSnapshot.empty) {
                return interaction.editReply({ embeds: [createErrorEmbed('The shop is currently empty. Tell an admin to stock up!')] });
            }
            
            const items = itemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const generateEmbed = (page) => {
                const start = page * ITEMS_PER_PAGE;
                const end = start + ITEMS_PER_PAGE;
                const currentItems = items.slice(start, end);

                const embed = createGheeEmbed('🛒 GheeSpot Shop', 'Use `/buy <item_id>` to purchase an item.')
                    .addFields(currentItems.map(item => ({
                        name: `${item.name} - 🪙 ${item.price.toLocaleString()} SC`,
                        value: `*ID: \`${item.id}\`*\n${item.description}`
                    })))
                    .setFooter({ text: `Page ${page + 1} of ${Math.ceil(items.length / ITEMS_PER_PAGE)}` });
                return embed;
            };

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('shop_prev_page').setLabel('◀️').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('shop_next_page').setLabel('▶️').setStyle(ButtonStyle.Secondary)
            );
            
            const message = await interaction.editReply({ embeds: [generateEmbed(0)], components: [row] });
            
            // Basic pagination collector
            const collector = message.createMessageComponentCollector({ time: 5 * 60 * 1000 });
            let currentPage = 0;
            collector.on('collect', i => {
                if (i.customId === 'shop_next_page') {
                    currentPage++;
                    if (currentPage * ITEMS_PER_PAGE >= items.length) currentPage = 0;
                } else if (i.customId === 'shop_prev_page') {
                    currentPage--;
                    if (currentPage < 0) currentPage = Math.floor((items.length - 1) / ITEMS_PER_PAGE);
                }
                i.update({ embeds: [generateEmbed(currentPage)] });
            });
            collector.on('end', () => message.edit({ components: [] }));

        } catch (error) {
            console.error('Error fetching shop items:', error);
            await interaction.editReply({ embeds: [createErrorEmbed('Could not load the shop due to a database error.')] });
        }
    },
};