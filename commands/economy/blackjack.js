// commands/economy/blackjack.js
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createGheeEmbed, createErrorEmbed } = require('../../utils/embeds');
const Blackjack = require('../../utils/blackjack');
const { FieldValue } = require('firebase-admin/firestore');

// In-memory store for active games
const activeGames = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('blackjack')
        .setDescription('Play a game of Blackjack against GheePT.')
        .addIntegerOption(option =>
            option.setName('bet')
                .setDescription('The amount of Spot Coins to bet.')
                .setRequired(true)
                .setMinValue(10)),

    async execute(interaction, db) {
        const betAmount = interaction.options.getInteger('bet');
        const user = interaction.user;
        const guildId = interaction.guild.id;
        const userDocRef = db.collection('users').doc(`${guildId}-${user.id}`);

        if (activeGames.has(user.id)) {
            return interaction.reply({ embeds: [createErrorEmbed("You're already in a game! Finish that one first.")], ephemeral: true });
        }

        await interaction.deferReply();
        
        try {
            const userDoc = await userDocRef.get();
            if (!userDoc.exists || userDoc.data().spotCoins < betAmount) {
                return interaction.editReply({ embeds: [createErrorEmbed("You don't have enough Spot Coins for that bet.")] });
            }

            // Deduct bet amount
            await userDocRef.update({ spotCoins: FieldValue.increment(-betAmount) });

            // Setup game
            const deck = Blackjack.createDeck();
            Blackjack.shuffleDeck(deck);

            const playerHand = [deck.pop(), deck.pop()];
            const dealerHand = [deck.pop(), deck.pop()];

            const game = {
                bet: betAmount,
                deck: deck,
                playerHand: playerHand,
                dealerHand: dealerHand,
                status: 'playing', // playing, win, lose, push
                interaction: interaction
            };
            activeGames.set(user.id, game);

            const embed = createGheeEmbed('🃏 Blackjack 🃏', `GheePT deals the cards. Your bet is **${betAmount} SC**.`)
                .addFields(
                    { name: `Your Hand (${Blackjack.getHandValue(playerHand)})`, value: Blackjack.handToString(playerHand), inline: true },
                    { name: `GheePT's Hand (${Blackjack.getHandValue([dealerHand[0]])})`, value: `${Blackjack.handToString([dealerHand[0]])} \`? \``, inline: true }
                );

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`blackjack_hit_${user.id}`).setLabel('Hit').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId(`blackjack_stand_${user.id}`).setLabel('Stand').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId(`blackjack_doubledown_${user.id}`).setLabel('Double Down').setStyle(ButtonStyle.Success)
            );
            
            await interaction.editReply({ embeds: [embed], components: [row] });

        } catch (error) {
            console.error(`Blackjack start error for user ${user.id}:`, error);
            // Refund bet if game fails to start
            await userDocRef.update({ spotCoins: FieldValue.increment(betAmount) }).catch(e=>console.error('Failed to refund user'));
            await interaction.editReply({ embeds: [createErrorEmbed('The casino is on fire! Something went wrong starting the game.')] });
        }
    },
    activeGames, // Export for the button handler
};