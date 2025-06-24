// events/interactionCreate.js
const { Events, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed, createGheeEmbed } = require('../utils/embeds');
const { FieldValue } = require('firebase-admin/firestore');
const Blackjack = require('../utils/blackjack');
const Roulette = require('../utils/roulette');
const { activeGames } = require('../commands/economy/blackjack');

// Handler functions defined here...
async function handleCommand(interaction, db) { /* ... */ }
async function handleProposalButton(interaction, db) { /* ... */ }
async function handleBlackjackButton(interaction, db) { /* ... */ }
async function handleLewdConsent(interaction, db) { /* ... */ }
async function handleAgeVerification(interaction, db) { /* ... */ }
async function handleRouletteButton(interaction, db) { /* ... */ }
async function handleRouletteModal(interaction, db) { /* ... */ }
async function runRouletteSpin(interaction, db) { /* ... */ }

// --- MAIN INTERACTION ROUTER ---
module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, db) {
        if (interaction.isChatInputCommand()) {
            await handleCommand(interaction, db);
        } else if (interaction.isButton()) {
            const [context] = interaction.customId.split('_');
            if (context === 'roulette') await handleRouletteButton(interaction, db);
            else if (context === 'accept' || context === 'decline') await handleProposalButton(interaction, db);
            else if (context === 'blackjack') await handleBlackjackButton(interaction, db);
            else if (context === 'consent') await handleLewdConsent(interaction, db);
            else if (context === 'age') await handleAgeVerification(interaction, db);
        } else if (interaction.isModalSubmit()) {
            const [context] = interaction.customId.split('_');
            if (context === 'roulette') await handleRouletteModal(interaction, db);
        } else if (interaction.isAutocomplete()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command || !command.autocomplete) return;
            try { await command.autocomplete(interaction, db); } catch (e) { console.error(e); }
        }
    },
};
