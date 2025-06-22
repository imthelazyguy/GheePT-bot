// events/interactionCreate.js
const { Events } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed, createGheeEmbed } = require('../utils/embeds');
const { FieldValue } = require('firebase-admin/firestore');
const Blackjack = require('../utils/blackjack');
const { activeGames } = require('../commands/economy/blackjack');

// --- COMMAND HANDLER ---
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

// --- BUTTON HANDLERS ---
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

    let gameOver = false;
    let resultMessage = '';
    let payout = 0;
    const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

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

        const embed = createGheeEmbed('🃏 Blackjack - Final Results 🃏', resultMessage)
            .addFields(
                { name: `Your Hand (${playerValue})`, value: Blackjack.handToString(game.playerHand), inline: true },
                { name: `GheePT's Hand (${Blackjack.getHandValue(game.dealerHand)})`, value: Blackjack.handToString(game.dealerHand), inline: true },
                { name: 'Outcome', value: `Bet: ${game.bet} SC | Payout: ${payout} SC` }
            );
        await interaction.editReply({ embeds: [embed], components: [] });
    } else {
        const embed = createGheeEmbed('🃏 Blackjack 🃏', `Your bet is **${game.bet} SC**. What's your next move?`)
            .addFields(
                { name: `Your Hand (${Blackjack.getHandValue(game.playerHand)})`, value: Blackjack.handToString(game.playerHand), inline: true },
                { name: `GheePT's Hand (${Blackjack.getHandValue([game.dealerHand[0]])})`, value: `${Blackjack.handToString([game.dealerHand[0]])} \`? \``, inline: true }
            );
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`blackjack_hit_${userId}`).setLabel('Hit').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId(`blackjack_stand_${userId}`).setLabel('Stand').setStyle(ButtonStyle.Secondary)
        );
        await interaction.editReply({ embeds: [embed], components: [row] });
    }
}

async function handleLewdConsent(interaction, db) {
    const userDocRef = db.collection('users').doc(`${interaction.guild.id}-${interaction.user.id}`);
    await userDocRef.set({ hasConsentedToLewd: true }, { merge: true });
    await interaction.update({ embeds: [createSuccessEmbed('Consent saved! You can now use lewd commands. Please try your command again.')], components: [] });
}

async function handleAgeVerification(interaction, db) {
    await interaction.deferReply({ ephemeral: true });
    const configDoc = await db.collection('guilds').doc(interaction.guild.id).get();
    if (!configDoc.exists) return interaction.editReply({ embeds: [createErrorEmbed('Server configuration not found.')] });

    const config = configDoc.data();
    const role18Plus = await interaction.guild.roles.fetch(config.roleId18Plus).catch(() => null);
    const roleUnder18 = await interaction.guild.roles.fetch(config.roleIdUnder18).catch(() => null);

    if (!role18Plus || !roleUnder18) return interaction.editReply({ embeds: [createErrorEmbed('Age roles are not configured correctly on this server.')] });

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
        await interaction.editReply({ embeds: [createErrorEmbed('I was unable to assign your role. Please check my permissions.')] });
    }
}


// --- MAIN INTERACTION ROUTER ---
module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, db) {
        if (interaction.isChatInputCommand()) {
            await handleCommand(interaction, db);
        } else if (interaction.isButton()) {
            const [context] = interaction.customId.split('_');
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
