// events/interactionCreate.js
const { Events, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed, createGheeEmbed } = require('../../utils/embeds');
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
    // ... (This function's full code from before) ...
}

async function handleBlackjackButton(interaction, db) {
    // ... (This function's full code from before) ...
}

async function handleLewdConsent(interaction, db) {
    // ... (This function's full code from before) ...
}

async function handleAgeVerification(interaction, db) {
    // ... (This function's full code from before) ...
}

async function handleRouletteButton(interaction, db) {
    const [context, action, userId, betAmountStr] = interaction.customId.split('_');
    const betAmount = parseInt(betAmountStr, 10);
    if (interaction.user.id !== userId) return interaction.reply({ content: "This isn't your game!", ephemeral: true });

    if (action === 'color' || action === 'parity') {
        const options = action === 'color' 
            ? [{ id: 'red', label: 'Red', emoji: '🔴' }, { id: 'black', label: 'Black', emoji: '⚫' }]
            : [{ id: 'even', label: 'Even', emoji: '2️⃣' }, { id: 'odd', label: 'Odd', emoji: '1️⃣' }];
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`roulette_place_${action}_${options[0].id}_${userId}_${betAmount}`).setLabel(options[0].label).setStyle(ButtonStyle.Primary).setEmoji(options[0].emoji),
            new ButtonBuilder().setCustomId(`roulette_place_${action}_${options[1].id}_${userId}_${betAmount}`).setLabel(options[1].label).setStyle(ButtonStyle.Primary).setEmoji(options[1].emoji)
        );
        await interaction.update({ content: `You chose **${action}**. Now pick one:`, components: [row] });
    } else if (action === 'number') {
        const modal = new ModalBuilder().setCustomId(`roulette_modal_number_${userId}_${betAmount}`).setTitle('Bet on a Single Number');
        const numberInput = new TextInputBuilder().setCustomId('number_input').setLabel("Enter a number between 0 and 36").setStyle(TextInputStyle.Short).setRequired(true).setMinLength(1).setMaxLength(2);
        modal.addComponents(new ActionRowBuilder().addComponents(numberInput));
        await interaction.showModal(modal);
    } else if (action === 'place') {
        await runRouletteSpin(interaction, db);
    }
}

async function handleRouletteModal(interaction, db) {
    const number = interaction.fields.getTextInputValue('number_input');
    const parsedNumber = parseInt(number, 10);
    if (isNaN(parsedNumber) || parsedNumber < 0 || parsedNumber > 36) {
        return interaction.reply({ embeds: [createErrorEmbed("Invalid number. Please enter a number between 0 and 36.")], ephemeral: true });
    }
    await runRouletteSpin(interaction, db);
}

async function runRouletteSpin(interaction, db) {
    let betType, betValue, userId, betAmount;

    if (interaction.isButton()) {
        await interaction.deferUpdate();
        const parts = interaction.customId.split('_');
        betType = parts[2]; betValue = parts[3]; userId = parts[4]; betAmount = parseInt(parts[5], 10);
    } else if (interaction.isModalSubmit()) {
        await interaction.deferReply({ ephemeral: true });
        const parts = interaction.customId.split('_');
        betType = parts[2]; betValue = interaction.fields.getTextInputValue('number_input'); userId = parts[3]; betAmount = parseInt(parts[4], 10);
    }

    const result = Roulette.spinWheel();
    const winnings = Roulette.calculatePayout(betType, betValue, result, betAmount);
    
    const resultColorEmoji = result.color === 'red' ? '🔴' : result.color === 'black' ? '⚫' : '🟢';
    const originalMessage = interaction.isModalSubmit() ? await interaction.channel.messages.fetch(interaction.message.reference.messageId) : interaction.message;

    await originalMessage.edit({ embeds: [createGheeEmbed('🎡 The Wheel is Spinning... 🎡', `No more bets! The ball is rolling...`)], components: [] });
    await new Promise(resolve => setTimeout(resolve, 3000));
    const finalEmbed = createGheeEmbed('🎡 And the result is...', `The ball landed on **${result.number} ${resultColorEmoji}**!`).setColor(winnings > 0 ? 'Gold' : 'Red');

    if (winnings > 0) {
        finalEmbed.addFields({ name: "🎉 YOU WON! 🎉", value: `Your bet on **${betValue}** paid out! You receive **${winnings.toLocaleString()} SC**.` });
        await db.collection('users').doc(`${interaction.guild.id}-${userId}`).update({ spotCoins: FieldValue.increment(winnings) });
    } else {
        finalEmbed.addFields({ name: "💔 YOU LOST 💔", value: `Your bet on **${betValue}** didn't hit. You lost your **${betAmount.toLocaleString()} SC**.` });
    }
    
    await originalMessage.edit({ embeds: [finalEmbed] });
    if(interaction.isModalSubmit()) await interaction.deleteReply();
}


// --- MAIN INTERACTION ROUTER ---
module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, db) {
        // ... (This main router logic should be the complete version from before, handling all buttons, modals, commands, etc.) ...
    },
};
