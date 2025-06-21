// commands/social/divorce.js
const { SlashCommandBuilder } = require('discord.js');
const { createGheeEmbed, createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds');
const { FieldValue } = require('firebase-admin/firestore');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('divorce')
        .setDescription('End your current relationship.'),

    async execute(interaction, db) {
        await interaction.deferReply({ ephemeral: true });

        const user = interaction.user;
        const guildId = interaction.guild.id;
        const userDocRef = db.collection('users').doc(`${guildId}-${user.id}`);

        try {
            const userDoc = await userDocRef.get();

            if (!userDoc.exists || !userDoc.data().relationship) {
                return interaction.editReply({ embeds: [createErrorEmbed("You aren't in a relationship to begin with.")] });
            }

            const relationship = userDoc.data().relationship;
            const partnerId = relationship.with[0]; // Assuming one partner for now

            const partnerDocRef = db.collection('users').doc(`${guildId}-${partnerId}`);

            // Use a batch write to update both documents at once
            const batch = db.batch();
            batch.update(userDocRef, { relationship: FieldValue.delete() });
            batch.update(partnerDocRef, { relationship: FieldValue.delete() });
            await batch.commit();
            
            const partnerUser = await interaction.client.users.fetch(partnerId).catch(() => null);
            if (partnerUser) {
                await partnerUser.send({ embeds: [createGheeEmbed('💔 Relationship Over', `**${user.username}** has ended your relationship.`)] }).catch(e => console.log(`Could not DM user ${partnerId} about divorce.`));
            }
            
            await interaction.editReply({ embeds: [createSuccessEmbed('You are now single and ready to mingle. Or cry. Your choice.')] });

        } catch (error) {
            console.error(`Error processing divorce for user ${user.id}:`, error);
            await interaction.editReply({ embeds: [createErrorEmbed('A database error occurred while trying to process the divorce.')] });
        }
    },
};