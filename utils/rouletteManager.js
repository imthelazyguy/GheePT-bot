// utils/rouletteManager.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder } = require('discord.js');
const { createErrorEmbed, createGheeEmbed } = require('./embeds');
const { FieldValue } = require('firebase-admin/firestore');
const Roulette = require('./roulette');

// This map will hold all active roulette games, with the channel ID as the key.
const activeGames = new Map();

async function startRouletteGame(interaction, db) {
    const channelId = interaction.channel.id;
    if (activeGames.has(channelId)) {
        return interaction.reply({ embeds: [createErrorEmbed("A roulette game is already in progress in this channel!")], ephemeral: true });
    }

    const gameId = `roulette_${channelId}`;
    const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('🎡 A Roulette Game Has Started! 🎡')
        .setDescription('The table is open for bets for the next **60 seconds**!\n\nClick "Place Bet" to join the fun.')
        .addFields({ name: 'Players & Bets', value: 'No bets placed yet.' })
        .setFooter({ text: 'The wheel will spin in 60 seconds.' });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`${gameId}_join`).setLabel('Place Bet').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`${gameId}_spin`).setLabel('Spin Now (Host)').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`${gameId}_cancel`).setLabel('Cancel (Host)').setStyle(ButtonStyle.Danger)
    );

    const message = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

    const game = {
        hostId: interaction.user.id,
        players: new Map(), // Stores { userId: { betType, betValue, betAmount } }
        state: 'betting',
        message: message,
        db: db,
        timeout: setTimeout(() => spinWheel(interaction.client, channelId), 60 * 1000),
    };
    activeGames.set(channelId, game);
}

async function spinWheel(client, channelId) {
    const game = activeGames.get(channelId);
    if (!game || game.state !== 'betting') return;

    game.state = 'spinning';
    clearTimeout(game.timeout); // Clear the automatic timer

    const spinEmbed = new EmbedBuilder(game.message.embeds[0].data)
        .setDescription('**Bets are closed!** The wheel is spinning...')
        .setFooter({ text: 'No more bets!' });
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
    
    await batch.commit().catch(e => console.error("Error committing roulette winnings:", e));

    const finalEmbed = createGheeEmbed('🎡 And the result is...', `The ball landed on **${result.number} ${resultColorEmoji}**!`)
        .addFields({ name: 'Payouts', value: resultsDescription.length > 0 ? resultsDescription : 'No one won this round.' });
    
    await game.message.edit({ embeds: [finalEmbed] });
    activeGames.delete(channelId);
}

async function handleRouletteInteraction(interaction) {
    const [context, channelId, action] = interaction.customId.split('_');
    const game = activeGames.get(channelId);
    if (!game) return interaction.update({ content: 'This roulette game has ended.', components: [], embeds: [] });

    const isHost = interaction.user.id === game.hostId;

    if (action === 'cancel') {
        if (!isHost) return interaction.reply({ embeds: [createErrorEmbed("Only the host can cancel the game.")], ephemeral: true });
        clearTimeout(game.timeout);
        const embed = new EmbedBuilder(game.message.embeds[0].data)
            .setDescription('This game was cancelled by the host.')
            .setColor('Red');
        await game.message.edit({ embeds: [embed], components: [] });
        activeGames.delete(channelId);
        return;
    }

    if (action === 'spin') {
        if (!isHost) return interaction.reply({ embeds: [createErrorEmbed("Only the host can spin the wheel early.")], ephemeral: true });
        if (game.players.size === 0) return interaction.reply({ embeds: [createErrorEmbed("Can't spin yet, nobody has placed a bet!")], ephemeral: true });
        await spinWheel(interaction.client, channelId);
        return;
    }

    if (action === 'join') {
        if (game.state !== 'betting') return interaction.reply({ embeds: [createErrorEmbed("Sorry, betting for this game has closed.")], ephemeral: true });
        const modal = new ModalBuilder()
            .setCustomId(`roulette_${channelId}_modal_placeBet`)
            .setTitle('Place Your Roulette Bet');

        const amountInput = new TextInputBuilder().setCustomId('bet_amount').setLabel("How much do you want to bet?").setStyle(TextInputStyle.Short).setRequired(true);
        const typeInput = new TextInputBuilder().setCustomId('bet_type').setLabel("Bet type (number, red, black, even, odd)").setStyle(TextInputStyle.Short).setRequired(true);
        const valueInput = new TextInputBuilder().setCustomId('bet_value').setLabel("Bet value (e.g., 17, or leave blank)").setStyle(TextInputStyle.Short).setRequired(false);
        
        modal.addComponents(new ActionRowBuilder().addComponents(amountInput), new ActionRowBuilder().addComponents(typeInput), new ActionRowBuilder().addComponents(valueInput));
        await interaction.showModal(modal);
    }
}

async function handleRouletteModal(interaction) {
    const [context, channelId, modalAction] = interaction.customId.split('_');
    const game = activeGames.get(channelId);
    if (!game || game.state !== 'betting') return interaction.reply({ embeds: [createErrorEmbed("Betting has closed.")], ephemeral: true });

    await interaction.deferReply({ ephemeral: true });
    
    const betAmount = parseInt(interaction.fields.getTextInputValue('bet_amount'), 10);
    const betTypeRaw = interaction.fields.getTextInputValue('bet_type').toLowerCase();
    let betValue = interaction.fields.getTextInputValue('bet_value');
    
    // Validation
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

    // Check user's balance and deduct bet
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

    // Add player to game
    game.players.set(interaction.user.id, { betType: finalBetType, betValue: finalBetValue, betAmount });

    // Update the main game embed
    let playersString = '';
    for (const [userId, bet] of game.players.entries()) {
        playersString += `\n<@${userId}> - 🪙 ${bet.betAmount.toLocaleString()} on **${bet.betValue}**`;
    }
    const updatedEmbed = new EmbedBuilder(game.message.embeds[0].data)
        .setFields({ name: 'Players & Bets', value: playersString });
    
    await game.message.edit({ embeds: [updatedEmbed] });
    await interaction.editReply({ embeds: [createSuccessEmbed(`Your bet of **${betAmount} SC** on **${finalBetValue}** has been placed!`)] });
}

module.exports = { startRouletteGame, handleRouletteInteraction, handleRouletteModal };
