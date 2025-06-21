// events/interactionCreate.js
const { Events } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed, createGheeEmbed } = require('../utils/embeds');
const { FieldValue } = require('firebase-admin/firestore');
const Blackjack = require('../utils/blackjack');
const { activeGames } = require('../commands/economy/blackjack');

async function handleCommand(interaction, db) {
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }
    try {
        await command.execute(interaction, db);
    } catch (error) {
        console.error(`Error executing command ${interaction.commandName}:`, error);
        const errorEmbed = createErrorEmbed(`GheePT just exploded trying to run that command.\nTell an admin this happened.`);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
}

// NOTE: The user has not provided the code for these handlers yet, but this is the structure.
// This is a placeholder for the user to fill in with the previously provided code.
async function handleProposalButton(interaction, db) { /* ... existing code ... */ }
async function handleBlackjackButton(interaction, db) { /* ... existing code ... */ }
async function handleLewdConsent(interaction, db) { /* ... existing code ... */ }
async function handleAgeVerification(interaction, db) { /* ... existing code ... */ }


module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, db) {
        if (interaction.isChatInputCommand()) {
            await handleCommand(interaction, db);
        } else if (interaction.isButton()) {
            const context = interaction.customId.split('_')[0];
            if (context === 'accept' || context === 'decline') {
                await handleProposalButton(interaction, db);
            } else if (context === 'blackjack') {
                await handleBlackjackButton(interaction, db);
            } else if (context === 'consent') {
                await handleLewdConsent(interaction, db);
            } else if (context === 'age') {
                await handleAgeVerification(interaction, db);
            }
        } else if (interaction.isAutocomplete()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command || !command.autocomplete) return;
            try {
                await command.autocomplete(interaction, db);
            } catch (error) {
                console.error('Autocomplete error:', error);
            }
        }
    },
};