// events/interactionCreate.js
const { Events, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, MessageFlags } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed, createGheeEmbed } = require('../utils/embeds');
const { FieldValue } = require('firebase-admin/firestore');
const Roulette = require('../utils/roulette');
const Blackjack = require('../utils/blackjack');
const { activeGames: activeBlackjackGames } = require('../commands/economy/blackjack');

// =================================================================================
// --- HANDLER FUNCTIONS - FULL IMPLEMENTATIONS ---
// =================================================================================

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
            await interaction.followUp({ content: 'There was a critical error while executing this command!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was a critical error while executing this command!', ephemeral: true });
        }
    }
}

// --- Roulette Handlers (New Multiplayer Logic) ---

async function handleRouletteButton(interaction) {
    const [context, channelId, action] = interaction.customId.split('_');
    const game = interaction.client.activeRouletteGames.get(channelId);

    if (!game) {
        return interaction.update({ content: 'This roulette game has expired or has been restarted.', components: [], embeds: [] });
    }

    if (game.state !== 'betting' && action === 'join') {
        return interaction.reply({ embeds: [createErrorEmbed("Sorry, betting for this game has closed.")], ephemeral: true });
    }
    
    const isHost = interaction.user.id === game.hostId;

    if (action === 'cancel') {
        if (!isHost) return interaction.reply({ embeds: [createErrorEmbed("Only the host can cancel the game.")], ephemeral: true });
        clearTimeout(game.timeout);
        const embed = new EmbedBuilder(game.message.embeds[0].data).setDescription('This game was cancelled by the host.').setColor('Red');
        await game.message.edit({ embeds: [embed], components: [] });
        interaction.client.activeRouletteGames.delete(channelId);
        return interaction.update({ content: 'Game cancelled.', embeds: [], components:[]});
    } 
    
    if (action === 'spin') {
        if (!isHost) return interaction.reply({ embeds: [createErrorEmbed("Only the host can spin the wheel early.")], ephemeral: true });
        if (game.players.size === 0) return interaction.reply({ embeds: [createErrorEmbed("Can't spin yet, nobody has placed a bet!")], ephemeral: true });
        await spinRouletteWheel(interaction.client, channelId);
    } 
    
    if (action === 'join') {
        const modal = new ModalBuilder().setCustomId(`roulette_${channelId}_modal_placeBet`).setTitle('Place Your Roulette Bet');
        const amountInput = new TextInputBuilder().setCustomId('bet_amount').setLabel("How much do you want to bet?").setStyle(TextInputStyle.Short).setRequired(true);
        const typeInput = new TextInputBuilder().setCustomId('bet_type').setLabel("Bet type (number, red, black, even, odd)").setStyle(TextInputStyle.Short).setRequired(true);
        const valueInput = new TextInputBuilder().setCustomId('bet_value').setLabel("Bet value (e.g., 17, or blank for colors)").setStyle(TextInputStyle.Short).setRequired(false);
        modal.addComponents(new ActionRowBuilder().addComponents(amountInput), new ActionRowBuilder().addComponents(typeInput), new ActionRowBuilder().addComponents(valueInput));
        await interaction.showModal(modal);
    }
}

async function handleRouletteModal(interaction) {
    const [context, channelId, modalAction] = interaction.customId.split('_');
    const game = interaction.client.activeRouletteGames.get(channelId);
    if (!game || game.state !== 'betting') return interaction.reply({ embeds: [createErrorEmbed("Betting has closed for this game.")], ephemeral: true });

    await interaction.deferReply({ ephemeral: true });
    
    const betAmount = parseInt(interaction.fields.getTextInputValue('bet_amount'), 10);
    const betTypeRaw = interaction.fields.getTextInputValue('bet_type').toLowerCase();
    let betValue = interaction.fields.getTextInputValue('bet_value');
    
    if (isNaN(betAmount) || betAmount <= 0) return interaction.editReply({ embeds: [createErrorEmbed("Please enter a valid bet amount.")] });
    
    let finalBetType, finalBetValue;
    const validTypes = ['number', 'red', 'black', 'even', 'odd'];
    if (!validTypes.includes(betTypeRaw)) return interaction.editReply({ embeds: [createErrorEmbed("Invalid bet type. Use 'number', 'red', 'black', 'even', or 'odd'.")] });

    if (betTypeRaw === 'number') {
        const num = parseInt(betValue, 10);
        if (isNaN(num) || num < 0 || num > 36) return interaction.editReply({ embeds: [createErrorEmbed("For a 'number' bet, please provide a value between 0 and 36.")] });
        finalBetType = 'number';
        finalBetValue = num.toString();
    } else {
        finalBetType = (betTypeRaw === 'red' || betTypeRaw === 'black') ? 'color' : 'parity';
        finalBetValue = betTypeRaw;
    }

    const userRef = game.db.collection('users').doc(`${interaction.guild.id}-${interaction.user.id}`);
    try {
        await game.db.runTransaction(async t => {
            const doc = await t.get(userRef);
            if (!doc.exists || (doc.data().spotCoins || 0) < betAmount) throw new Error("You don't have enough Spot Coins for that bet.");
            t.update(userRef, { spotCoins: FieldValue.increment(-betAmount) });
        });
    } catch (error) {
        return interaction.editReply({ embeds: [createErrorEmbed(error.message)] });
    }

    game.players.set(interaction.user.id, { betType: finalBetType, betValue: finalBetValue, betAmount });

    let playersString = '';
    for (const [userId, bet] of game.players.entries()) {
        playersString += `\n<@${userId}> - 🪙 ${bet.betAmount.toLocaleString()} on **${bet.betValue}**`;
    }
    const updatedEmbed = new EmbedBuilder(game.message.embeds[0].data).setFields({ name: 'Players & Bets', value: playersString });
    
    await game.message.edit({ embeds: [updatedEmbed] });
    await interaction.editReply({ embeds: [createSuccessEmbed(`Your bet of **${betAmount} SC** on **${finalBetValue}** has been placed!`)] });
}

async function spinRouletteWheel(client, channelId) {
    const game = client.activeRouletteGames.get(channelId);
    if (!game || game.state !== 'betting') return;

    game.state = 'spinning';
    clearTimeout(game.timeout);

    const spinEmbed = new EmbedBuilder(game.message.embeds[0].data).setDescription('**Bets are closed!** The wheel is spinning...').setFooter({ text: 'No more bets!' });
    await game.message.edit({ embeds: [spinEmbed], components: [] });

    await new Promise(resolve => setTimeout(resolve, 3000));

    const result = Roulette.spinWheel();
    const resultColorEmoji = result.color === 'red' ? '🔴' : result.color === 'black' ? '⚫' : '🟢';
    let resultsDescription = '';
    const db = game.db;
    const batch = db.batch();

    for (const [userId, bet] of game.players.entries()) {
        const winnings = Roulette.calculatePayout(bet.betType, bet.betValue, result, bet.betAmount);
        if (winnings > 0) {
            const userRef = db.collection('users').doc(`${game.message.guild.id}-${userId}`);
            batch.update(userRef, { spotCoins: FieldValue.increment(winnings) });
            resultsDescription += `\n<@${userId}> bet on **${bet.betValue}** and won **🪙 ${winnings.toLocaleString()}**!`;
        } else {
            resultsDescription += `\n<@${userId}> bet on **${bet.betValue}** and lost **🪙 ${bet.betAmount.toLocaleString()}**.`;
        }
    }
    
    if(game.players.size > 0) await batch.commit().catch(e => console.error("Error committing roulette winnings:", e));

    const finalEmbed = createGheeEmbed('🎡 And the result is...', `The ball landed on **${result.number} ${resultColorEmoji}**!`).addFields({ name: 'Payouts', value: resultsDescription.length > 0 ? resultsDescription : 'No one won this round.' });
    
    await game.message.edit({ embeds: [finalEmbed] });
    client.activeRouletteGames.delete(channelId);
}

// --- Other Handlers (Blackjack, Proposals, etc.) ---
// ... (Your complete, working handler functions for other features go here) ...


// =================================================================================
// --- MAIN INTERACTION ROUTER ---
// =================================================================================

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, db) {
        if (interaction.isChatInputCommand()) {
            await handleCommand(interaction, db);
            return;
        }

        if (interaction.isAutocomplete()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command || !command.autocomplete) return;
            try { await command.autocomplete(interaction, db); } catch (e) { console.error(e); }
            return;
        }

        const [context] = interaction.customId.split('_');

        if (interaction.isButton()) {
            switch (context) {
                case 'roulette':
                    await handleRouletteButton(interaction);
                    break;
                // Add other button handlers here
                // case 'blackjack':
                //     await handleBlackjackButton(interaction, db);
                //     break;
                // case 'accept':
                // case 'decline':
                //     await handleProposalButton(interaction, db);
                //     break;
                default:
                    console.log(`Received unhandled button interaction: ${interaction.customId}`);
            }
            return;
        }

        if (interaction.isModalSubmit()) {
            if (context === 'roulette') {
                await handleRouletteModal(interaction);
            }
            // Add other modal handlers here
            return;
        }
    },
};
