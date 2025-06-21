// commands/economy/buy.js
const { SlashCommandBuilder } = require('discord.js');
const { createGheeEmbed, createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds');
const { FieldValue } = require('firebase-admin/firestore');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('buy')
        .setDescription('Purchase an item from the shop.')
        .addStringOption(option => option.setName('item_id').setDescription('The unique ID of the item you want to buy.').setRequired(true)),

    async execute(interaction, db) {
        await interaction.deferReply({ ephemeral: true });

        const itemId = interaction.options.getString('item_id').toLowerCase();
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;
        
        const itemRef = db.collection('shop_items').doc(itemId);
        const userRef = db.collection('users').doc(`${guildId}-${userId}`);

        try {
            await db.runTransaction(async (transaction) => {
                const itemDoc = await transaction.get(itemRef);
                if (!itemDoc.exists) {
                    throw new Error("Item not found. Check the ID in the `/shop`.");
                }

                const userDoc = await transaction.get(userRef);
                const itemData = itemDoc.data();
                const userData = userDoc.data() || { spotCoins: 0, inventory: [] };

                if ((userData.spotCoins || 0) < itemData.price) {
                    throw new Error("You don't have enough Spot Coins for this item.");
                }
                
                if ((userData.inventory || []).includes(itemId)) {
                    throw new Error("You already own this item.");
                }

                transaction.update(userRef, {
                    spotCoins: FieldValue.increment(-itemData.price),
                    inventory: FieldValue.arrayUnion(itemId)
                });
            });

            await interaction.editReply({ embeds: [createSuccessEmbed(`You have successfully purchased the "${itemId}" item!`)] });

        } catch (error) {
            console.error(`Purchase failed for user ${userId}, item ${itemId}:`, error);
            await interaction.editReply({ embeds: [createErrorEmbed(error.message || 'The transaction failed.')] });
        }
    },
};