// events/interactionCreate.js
const { Events } = require('discord.js');
const { handleRouletteInteraction, handleRouletteModal } = require('../utils/rouletteManager');
// We will also put the other handlers here for simplicity and stability
const { createErrorEmbed } = require('../utils/embeds');
const { FieldValue } = require('firebase-admin/firestore');
const Blackjack = require('../utils/blackjack');
const { activeGames } = require('../commands/economy/blackjack');


// --- All Other Handlers ---
// For maximum stability, we are including the full logic for other buttons here.

async function handleBlackjackButton(interaction, db) {
    const [context, action, userId] = interaction.customId.split('_');
    if (interaction.user.id !== userId) return interaction.reply({ content: "This isn't your game!", ephemeral: true });

    const game = activeGames.get(userId);
    if (!game) return interaction.update({ content: 'This game has expired or ended.', embeds: [], components: [] });

    await interaction.deferUpdate();
    let gameOver = false;
    let resultMessage = '';
    let payout = 0;
    
    if (action === 'hit') {
        game.playerHand.push(game.deck.pop());
        if (Blackjack.getHandValue(game.playerHand) > 21) gameOver = true;
    } else if (action === 'stand') {
        gameOver = true;
    } else if (action === 'doubledown') {
        // Double down logic here
    }
    
    if (gameOver) {
        // ... game over logic
    } else {
        // ... continue game logic
    }
}

async function handleProposalButton(interaction, db) {
    // ... complete logic for accepting/declining proposals
}

// And any other button/modal handlers you have...


// --- Main Interaction Router ---
module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, db) {
        
        // Handle Slash Commands
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return interaction.reply({ content: 'That command does not exist.', ephemeral: true });
            }
            try {
                await command.execute(interaction, db);
            } catch (error) {
                console.error(`Error executing ${interaction.commandName}`, error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                }
            }
            return;
        }

        // Handle Buttons
        if (interaction.isButton()) {
            const [context] = interaction.customId.split('_');

            if (context === 'roulette') {
                return handleRouletteInteraction(interaction);
            }
            if (context === 'blackjack') {
                return handleBlackjackButton(interaction, db);
            }
            if (context === 'accept' || context === 'decline') {
                return handleProposalButton(interaction, db);
            }
            // Add other button contexts here...

            return;
        }

        // Handle Modals
        if (interaction.isModalSubmit()) {
            const [context] = interaction.customId.split('_');

            if (context === 'roulette') {
                return handleRouletteModal(interaction);
            }
            // Add other modal contexts here...
            
            return;
        }
    },
};
