// commands/admin/shop/additem.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed } = require('../../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('additem')
        .setDescription('Adds an item to the server shop. (Owner Only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option => option.setName('item_id').setDescription('A unique ID for the item (e.g., "custom_color_1").').setRequired(true))
        .addStringOption(option => option.setName('name').setDescription('The display name of the item.').setRequired(true))
        .addStringOption(option => option.setName('description').setDescription('A description for the item.').setRequired(true))
        .addIntegerOption(option => option.setName('price').setDescription('The price in Spot Coins.').setRequired(true).setMinValue(0)),

    async execute(interaction, db) {
        const { OWNER_IDS } = require('../../../config');
        if (!OWNER_IDS.includes(interaction.user.id)) {
            return interaction.reply({ embeds: [createErrorEmbed('This command can only be used by the bot owner.')], ephemeral: true });
        }
        await interaction.deferReply({ ephemeral: true });

        const itemId = interaction.options.getString('item_id').toLowerCase();
        const name = interaction.options.getString('name');
        const description = interaction.options.getString('description');
        const price = interaction.options.getInteger('price');

        const itemRef = db.collection('shop_items').doc(itemId);

        try {
            await itemRef.set({ name, description, price });
            await interaction.editReply({ embeds: [createSuccessEmbed(`Item "${name}" has been added to the shop with ID \`${itemId}\` for ${price} SC.`)] });
        } catch (error) {
            console.error('Failed to add shop item:', error);
            await interaction.editReply({ embeds: [createErrorEmbed('A database error occurred.')] });
        }
    },
};