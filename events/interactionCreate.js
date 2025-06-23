// events/interactionCreate.js
const { Events, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed, createGheeEmbed } = require('../utils/embeds'); // FIX: Corrected the path from ../../ to ../
const { FieldValue } = require('firebase-admin/firestore');
const Blackjack = require('../utils/blackjack');
const Roulette = require('../utils/roulette');
const { activeGames } = require('../commands/economy/blackjack');

// --- HANDLER FUNCTIONS ---
// This section contains the logic for every type of interaction.

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
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
}

async function handleProposalButton(interaction, db) {
    const [action, context, proposalId] = interaction.customId.split('_');
    await interaction.deferUpdate();
    const proposalRef = db.collection('proposals').doc(proposalId);
    try {
        const proposalDoc = await proposalRef.get();
        if (!proposalDoc.exists) return interaction.editReply({ content: 'This proposal has expired or is invalid.', embeds: [], components: [] });
        const proposal = proposalDoc.data();
        if (interaction.user.id !== proposal.partnerId) return;

        const proposer = await interaction.client.users.fetch(proposal.proposerId);
        const partner = interaction.user;

        if (action === 'accept') {
            const proposerDocRef = db.collection('users').doc(`${proposal.guildId}-${proposer.id}`);
            const partnerDocRef = db.collection('users').doc(`${proposal.guildId}-${partner.id}`);
            const batch = db.batch();
            batch.set(proposerDocRef, { relationship: { type: proposal.type, with: [partner.id], since: new Date() } }, { merge: true });
            batch.set(partnerDocRef, { relationship: { type: proposal.type, with: [proposer.id], since: new Date() } }, { merge: true });
            batch.delete(proposalRef);
            await batch.commit();

            await interaction.editReply({ content: 'You have accepted the proposal!', embeds: [], components: [] });
            await proposer.send({ embeds: [createGheeEmbed('💖 She said yes!', `${partner.username} has accepted your proposal!`)] });
        } else if (action === 'decline') {
            await proposalRef.delete();
            await interaction.editReply({ content: 'You have declined the proposal.', embeds: [], components: [] });
            await proposer.send({ embeds: [createGheeEmbed('💔 Maybe Next Time', `${partner.username} has declined your proposal.`)] });
        }
    } catch (error) {
        console.error(`Error handling proposal button for proposal ${proposalId}:`, error);
        await interaction.editReply({ content: 'There was an error processing this proposal.', embeds: [], components: [] });
    }
}

async function handleBlackjackButton(interaction, db) {
    const [context, action, userId] = interaction.customId.split('_');
    if (interaction.user.id !== userId) return interaction.reply({ content: "This isn't your game!", ephemeral: true });

    const game = activeGames.get(userId);
    if (!game) return interaction.update({ content: 'This game has expired or ended.', embeds: [], components: [] });

    await interaction.deferUpdate();
    //... (rest of blackjack logic)
}

async function handleLewdConsent(interaction, db) {
    const userDocRef = db.collection('users').doc(`${interaction.guild.id}-${interaction.user.id}`);
    await userDocRef.set({ hasConsentedToLewd: true }, { merge: true });
    await interaction.update({ embeds: [createSuccessEmbed('Consent saved! You can now use lewd commands. Please try your command again.')], components: [] });
}

async function handleAgeVerification(interaction, db) {
    // ... (full logic for age verification)
}

async function handleRouletteButton(interaction, db) {
    // ... (full logic for roulette buttons)
}

async function handleRouletteModal(interaction, db) {
    // ... (full logic for roulette modal)
}

async function runRouletteSpin(interaction, db) {
    // ... (full logic for the spin)
}


// --- MAIN INTERACTION ROUTER ---
module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, db) {
        if (interaction.isChatInputCommand()) {
            await handleCommand(interaction, db);
        } else if (interaction.isButton()) {
            const [context] = interaction.customId.split('_');
            if (context === 'roulette') {
                await handleRouletteButton(interaction, db);
            } else if (context === 'accept' || context === 'decline') {
                await handleProposalButton(interaction, db);
            } else if (context === 'blackjack') {
                await handleBlackjackButton(interaction, db);
            } else if (context === 'consent') {
                await handleLewdConsent(interaction, db);
            } else if (context === 'age') {
                await handleAgeVerification(interaction, db);
            }
        } else if (interaction.isModalSubmit()) {
            const [context] = interaction.customId.split('_');
            if (context === 'roulette') {
                await handleRouletteModal(interaction, db);
            }
        } else if (interaction.isAutocomplete()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command || !command.autocomplete) return;
            try { await command.autocomplete(interaction, db); } catch (e) { console.error(e); }
        }
    },
};
