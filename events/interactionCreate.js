// events/interactionCreate.js
const { Events, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed, createGheeEmbed } = require('../utils/embeds');
const { FieldValue } = require('firebase-admin/firestore');
const Blackjack = require('../utils/blackjack');
const Roulette = require('../utils/roulette');
const { activeGames } = require('../commands/economy/blackjack');

async function handleCommand(interaction, db) {
    console.log(`[DEBUG] handleCommand started for /${interaction.commandName}.`);
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) {
        console.error(`[DEBUG] No command matching ${interaction.commandName} was found.`);
        return;
    }
    try {
        console.log(`[DEBUG] Executing command: /${interaction.commandName}.`);
        await command.execute(interaction, db);
        console.log(`[DEBUG] Finished command: /${interaction.commandName}.`);
    } catch (error) {
        console.error(`[DEBUG] Error executing /${interaction.commandName}:`, error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
}

// ... ALL OTHER HANDLER FUNCTIONS (handleProposalButton, handleBlackjackButton, handleRouletteButton, etc.) GO HERE ...
// It is critical that the full code for these functions remains here.

// --- MAIN INTERACTION ROUTER ---
module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, db) {
        console.log(`[DEBUG] Interaction received. User: ${interaction.user.username}, Type: ${interaction.type}, ID: ${interaction.isCommand() ? interaction.commandName : interaction.customId}`);
        if (interaction.isChatInputCommand()) {
            await handleCommand(interaction, db);
        } else if (interaction.isButton()) {
            // ... The rest of your button routing logic ...
        } else if (interaction.isModalSubmit()) {
            // ... The rest of your modal routing logic ...
        } else if (interaction.isAutocomplete()) {
            // ... The rest of your autocomplete logic ...
        }
    },
};
