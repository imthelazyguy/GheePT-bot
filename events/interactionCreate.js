// events/interactionCreate.js
const { Events, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed, createGheeEmbed } = require('../utils/embeds');
const { FieldValue } = require('firebase-admin/firestore');
const Blackjack = require('../utils/blackjack');
const Roulette = require('../utils/roulette');
const { activeGames } = require('../commands/economy/blackjack');

// =================================================================================
// --- HANDLER FUNCTIONS ---
// This section contains the complete logic for every type of interaction.
// =================================================================================

async function handleCommand(interaction, db) {
    // ... (This function's full code from before) ...
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
    if (interaction.user.id !== userId) return interaction.reply({ content: "This isn't your game!", ephemeral: true });

    if (action === 'color' || action === 'parity') {
        const betAmount = parseInt(betAmountStr, 10);
        const options = action === 'color' 
            ? [{ id: 'red', label: 'Red', emoji: '🔴' }, { id: 'black', label: 'Black', emoji: '⚫' }]
            : [{ id: 'even', label: 'Even', emoji: '2️⃣' }, { id: 'odd', label: 'Odd', emoji: '1️⃣' }];
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`roulette_place_${action}_${options[0].id}_${userId}_${betAmount}`).setLabel(options[0].label).setStyle(ButtonStyle.Primary).setEmoji(options[0].emoji),
            new ButtonBuilder().setCustomId(`roulette_place_${action}_${options[1].id}_${userId}_${betAmount}`).setLabel(options[1].label).setStyle(ButtonStyle.Primary).setEmoji(options[1].emoji)
        );
        await interaction.update({ content: `You chose to bet on **${action}**. Now pick one:`, components: [row], embeds: [] });
    } else if (action === 'number') {
        const betAmount = parseInt(betAmountStr, 10);
        const modal = new ModalBuilder().setCustomId(`roulette_modal_number_${userId}_${betAmount}`).setTitle('Bet on a Single Number');
        const numberInput = new TextInputBuilder().setCustomId('number_input').setLabel("Enter a number between 0 and 36").setStyle(TextInputStyle.Short).setRequired(true).setMinLength(1).setMaxLength(2);
        modal.addComponents(new ActionRowBuilder().addComponents(numberInput));
        await interaction.showModal(modal);
    } else if (action === 'place') {
        await runRouletteSpin(interaction, db);
    }
}

async function handleRouletteModal(interaction, db) {
    await runRouletteSpin(interaction, db);
}

async function runRouletteSpin(interaction, db) {
    let betType, betValue, userId, betAmount;

    if (interaction.isButton()) {
        await interaction.deferUpdate();
        const parts = interaction.customId.split('_'); // roulette_place_color_red_userId_bet
        betType = parts[2]; betValue = parts[3]; userId = parts[4]; betAmount = parseInt(parts[5], 10);
    } else if (interaction.isModalSubmit()) {
        await interaction.deferReply({ ephemeral: true });
        const parts = interaction.customId.split('_'); // roulette_modal_number_userId_bet
        betType = parts[2]; betValue = interaction.fields.getTextInputValue('number_input'); userId = parts[3]; betAmount = parseInt(parts[4], 10);
        const parsedNum = parseInt(betValue, 10);
        if (isNaN(parsedNum) || parsedNum < 0 || parsedNum > 36) return interaction.editReply({ embeds: [createErrorEmbed("Invalid number. Please enter a number between 0 and 36.")], ephemeral: true });
    }

    const result = Roulette.spinWheel();
    const winnings = Roulette.calculatePayout(betType, betValue, result, betAmount);
    
    const originalMessage = interaction.isButton() ? interaction.message : null;
    
    const spinEmbed = createGheeEmbed('🎡 The Wheel is Spinning... 🎡', `No more bets! The ball is rolling...`);
    if (originalMessage) {
        await originalMessage.edit({ embeds: [spinEmbed], components: [], content: ' ' });
    } else {
        await interaction.channel.send({ embeds: [spinEmbed] });
    }
    
    await new Promise(resolve => setTimeout(resolve, 3000));

    const resultColorEmoji = result.color === 'red' ? '🔴' : result.color === 'black' ? '⚫' : '🟢';
    const finalEmbed = createGheeEmbed('🎡 And the result is...', `<@${userId}> bet on **${betValue}**.\nThe ball landed on **${result.number} ${resultColorEmoji}**!`).setColor(winnings > 0 ? 'Gold' : 'Red');

    if (winnings > 0) {
        finalEmbed.addFields({ name: "🎉 YOU WON! 🎉", value: `Your bet paid out! You receive **${winnings.toLocaleString()} SC**.` });
        await db.collection('users').doc(`${interaction.guild.id}-${userId}`).update({ spotCoins: FieldValue.increment(winnings) });
    } else {
        finalEmbed.addFields({ name: "💔 YOU LOST 💔", value: `Your bet didn't hit. Your **${betAmount.toLocaleString()} SC** is gone.` });
    }
    
    if (originalMessage) {
        await originalMessage.edit({ embeds: [finalEmbed] });
    } else {
        await interaction.channel.send({ embeds: [finalEmbed] });
        if(interaction.isModalSubmit()) await interaction.deleteReply();
    }
}

// =================================================================================
// --- MAIN INTERACTION ROUTER ---
// =================================================================================

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
