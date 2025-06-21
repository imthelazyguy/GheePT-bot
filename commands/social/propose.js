// commands/social/propose.js
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createGheeEmbed, createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds');
const { v4: uuidv4 } = require('uuid'); // Run `npm install uuid` to add this dependency

module.exports = {
    data: new SlashCommandBuilder()
        .setName('propose')
        .setDescription('Propose a relationship to another member.')
        .addUserOption(option => option.setName('partner').setDescription('The user you want to propose to.').setRequired(true))
        .addStringOption(option => option.setName('type').setDescription('The type of relationship (e.g., BFF, BF/GF, Husband/Wife).').setRequired(true)),

    async execute(interaction, db) {
        await interaction.deferReply({ ephemeral: true });
        
        const proposer = interaction.user;
        const partner = interaction.options.getUser('partner');
        const type = interaction.options.getString('type');
        const guildId = interaction.guild.id;

        // --- Pre-checks ---
        if (proposer.id === partner.id) {
            return interaction.editReply({ embeds: [createErrorEmbed("You can't propose to yourself, you narcissist.")] });
        }
        if (partner.bot) {
            return interaction.editReply({ embeds: [createErrorEmbed("You can't propose to a bot. I'm flattered, but I have standards.")] });
        }

        try {
            const partnerDocRef = db.collection('users').doc(`${guildId}-${partner.id}`);
            const partnerDoc = await partnerDocRef.get();
            if (partnerDoc.exists && partnerDoc.data().relationship) {
                return interaction.editReply({ embeds: [createErrorEmbed(`${partner.username} is already in a relationship.`)] });
            }

            const proposalId = uuidv4();
            const proposal = {
                proposerId: proposer.id,
                partnerId: partner.id,
                type: type,
                guildId: guildId,
                expiresAt: new Date(Date.now() + 15 * 60 * 1000), // Proposal expires in 15 minutes
            };
            
            // Store the proposal in Firestore
            await db.collection('proposals').doc(proposalId).set(proposal);

            const proposalEmbed = createGheeEmbed('💌 A Proposal For You!', `**${proposer.username}** has proposed to you! They want to be your **${type}**.\n\nDo you accept? This request will expire in 15 minutes.`);
            
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId(`accept_proposal_${proposalId}`).setLabel('Accept').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId(`decline_proposal_${proposalId}`).setLabel('Decline').setStyle(ButtonStyle.Danger)
                );

            // Send a DM to the partner with the proposal
            await partner.send({ embeds: [proposalEmbed], components: [row] });
            
            await interaction.editReply({ embeds: [createSuccessEmbed(`Your proposal has been sent to ${partner.username}! They have 15 minutes to respond.`)] });

        } catch (error) {
            if (error.code === 50007) { // Cannot send messages to this user
                await interaction.editReply({ embeds: [createErrorEmbed(`Could not send the proposal because ${partner.username} has DMs disabled.`)] });
            } else {
                console.error(`Error sending proposal from ${proposer.id} to ${partner.id}:`, error);
                await interaction.editReply({ embeds: [createErrorEmbed('Something went wrong while sending the proposal.')] });
            }
        }
    },
};