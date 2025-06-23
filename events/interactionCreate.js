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
            const batch = db.batch();
            batch.set(db.collection('users').doc(`${proposal.guildId}-${proposer.id}`), { relationship: { type: proposal.type, with: [partner.id], since: new Date() } }, { merge: true });
            batch.set(db.collection('users').doc(`${proposal.guildId}-${partner.id}`), { relationship: { type: proposal.type, with: [proposer.id], since: new Date() } }, { merge: true });
            batch.delete(proposalRef);
            await batch.commit();
            await interaction.editReply({ content: 'You have accepted the proposal!', embeds: [], components: [] });
            await proposer.send({ embeds: [createGheeEmbed('💖 She said yes!', `${partner.username} has accepted your proposal!`)] }).catch(()=>{});
        } else if (action === 'decline') {
            await proposalRef.delete();
            await interaction.editReply({ content: 'You have declined the proposal.', embeds: [], components: [] });
            await proposer.send({ embeds: [createGheeEmbed('💔 Maybe Next Time', `${partner.username} has declined your proposal.`)] }).catch(()=>{});
        }
    } catch (error) {
        console.error(`Error handling proposal button:`, error);
        await interaction.editReply({ content: 'There was an error processing this proposal.', embeds: [], components: [] });
    }
}

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
        const userDocRef = db.collection('users').doc(`${interaction.guild.id}-${userId}`);
        const userDoc = await userDocRef.get();
        if ((userDoc.data().spotCoins || 0) < game.bet) return interaction.followUp({ content: "You don't have enough SC to double down!", ephemeral: true });
        await userDocRef.update({ spotCoins: FieldValue.increment(-game.bet) });
        game.bet *= 2;
        game.playerHand.push(game.deck.pop());
        gameOver = true;
    }
    
    if (gameOver) {
        activeGames.delete(userId);
        const playerValue = Blackjack.getHandValue(game.playerHand);
        if (playerValue > 21) {
            resultMessage = `You busted with ${playerValue}! GheePT wins.`;
            payout = 0;
        } else {
            while (Blackjack.getHandValue(game.dealerHand) < 17) game.dealerHand.push(game.deck.pop());
            const dealerValue = Blackjack.getHandValue(game.dealerHand);
            if (dealerValue > 21 || playerValue > dealerValue) {
                resultMessage = `You win with ${playerValue} against GheePT's ${dealerValue}!`;
                payout = game.bet * 2;
            } else if (dealerValue > playerValue) {
                resultMessage = `GheePT wins with ${dealerValue} against your ${playerValue}. Better luck next time.`;
                payout = 0;
            } else {
                resultMessage = `It's a push! Both have ${playerValue}. Your bet is returned.`;
                payout = game.bet;
            }
        }
        if (payout > 0) await db.collection('users').doc(`${interaction.guild.id}-${userId}`).update({ spotCoins: FieldValue.increment(payout) });
        const embed = createGheeEmbed('🃏 Blackjack - Final Results 🃏', resultMessage).addFields({ name: `Your Hand (${playerValue})`, value: Blackjack.handToString(game.playerHand), inline: true }, { name: `GheePT's Hand (${Blackjack.getHandValue(game.dealerHand)})`, value: Blackjack.handToString(game.dealerHand), inline: true }, { name: 'Outcome', value: `Bet: ${game.bet} SC | Payout: ${payout} SC` });
        await interaction.editReply({ embeds: [embed], components: [] });
    } else {
        const embed = createGheeEmbed('🃏 Blackjack 🃏', `Your bet is **${game.bet} SC**. What's your next move?`).addFields({ name: `Your Hand (${Blackjack.getHandValue(game.playerHand)})`, value: Blackjack.handToString(game.playerHand), inline: true }, { name: `GheePT's Hand (${Blackjack.getHandValue([game.dealerHand[0]])})`, value: `${Blackjack.handToString([game.dealerHand[0]])} \`? \``, inline: true });
        const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`blackjack_hit_${userId}`).setLabel('Hit').setStyle(ButtonStyle.Primary), new ButtonBuilder().setCustomId(`blackjack_stand_${userId}`).setLabel('Stand').setStyle(ButtonStyle.Secondary));
        await interaction.editReply({ embeds: [embed], components: [row] });
    }
}

async function handleLewdConsent(interaction, db) {
    await interaction.deferUpdate();
    const userDocRef = db.collection('users').doc(`${interaction.guild.id}-${interaction.user.id}`);
    await userDocRef.set({ hasConsentedToLewd: true }, { merge: true });
    await interaction.editReply({ embeds: [createSuccessEmbed('Consent saved! You can now use lewd commands. Please try your command again.')], components: [] });
}

async function handleAgeVerification(interaction, db) {
    await interaction.deferReply({ ephemeral: true });
    const configDoc = await db.collection('guilds').doc(interaction.guild.id).get();
    if (!configDoc.exists) return interaction.editReply({ embeds: [createErrorEmbed('Server configuration not found.')] });
    const config = configDoc.data();
    const role18Plus = await interaction.guild.roles.fetch(config.roleId18Plus).catch(() => null);
    const roleUnder18 = await interaction.guild.roles.fetch(config.roleIdUnder18).catch(() => null);
    if (!role18Plus || !roleUnder18) return interaction.editReply({ embeds: [createErrorEmbed('Age roles are not configured correctly.')] });
    const member = interaction.member;
    const is18Plus = interaction.customId.includes('18_plus');
    try {
        if (is18Plus) {
            await member.roles.remove(roleUnder18).catch(() => {});
            await member.roles.add(role18Plus);
            await interaction.editReply({ embeds: [createSuccessEmbed('You have been verified as 18+.')] });
        } else {
            await member.roles.remove(role18Plus).catch(() => {});
            await member.roles.add(roleUnder18);
            await interaction.editReply({ embeds: [createSuccessEmbed('You have been verified as Under 18.')] });
        }
    } catch (error) {
        console.error('Failed to assign age role:', error);
        await interaction.editReply({ embeds: [createErrorEmbed('I was unable to assign your role.')] });
    }
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
        await interaction.update({ content: `You chose **${action}**. Now pick one:`, components: [row], embeds: [] });
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
    
    // For modals, we don't have an original message to edit easily, so we send a new public one.
    // For buttons, we edit the existing message.
    const interactionChannel = interaction.channel;
    const originalMessage = interaction.isButton() ? interaction.message : null;
    
    const spinEmbed = createGheeEmbed('🎡 The Wheel is Spinning... 🎡', `No more bets! The ball is rolling...`);
    if (originalMessage) {
        await originalMessage.edit({ embeds: [spinEmbed], components: [], content: ' ' });
    } else {
        await interactionChannel.send({ embeds: [spinEmbed] });
    }
    
    await new Promise(resolve => setTimeout(resolve, 3000));

    const resultColorEmoji = result.color === 'red' ? '🔴' : result.color === 'black' ? '⚫' : '🟢';
    const finalEmbed = createGheeEmbed('🎡 And the result is...', `<@${userId}> bet on **${betValue}**.\nThe ball landed on **${result.number} ${resultColorEmoji}**!`).setColor(winnings > 0 ? 'Gold' : 'Red');

    if (winnings > 0) {
        finalEmbed.addFields({ name: "🎉 YOU WON! 🎉", value: `Your bet paid out! You receive **${winnings.toLocaleString()} SC**.` });
        await db.collection('users').doc(`${interaction.guild.id}-${userId}`).update({ spotCoins: FieldValue.increment(winnings) });
    } else {
        finalEmbed.addFields({ name: "💔 YOU LOST 💔", value: `Your bet didn't hit. You lost your **${betAmount.toLocaleString()} SC**.` });
    }
    
    if (originalMessage) {
        await originalMessage.edit({ embeds: [finalEmbed] });
    } else {
        await interactionChannel.send({ embeds: [finalEmbed] });
        await interaction.deleteReply();
    }
}

// =================================================================================
// --- MAIN INTERACTION ROUTER ---
// This is the central nervous system that directs all interactions.
// =================================================================================

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
