// commands/admin/events.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createGheeEmbed, createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds');
const { FieldValue } = require('firebase-admin/firestore');
const ms = require('ms');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('event')
        .setDescription('Manage custom server events. (Admin Only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand.setName('create').setDescription('Define a new custom event.')
                .addStringOption(option => option.setName('id').setDescription('Unique ID for the event (e.g., "xmas2025").').setRequired(true))
                .addStringOption(option => option.setName('name').setDescription('The name of the event.').setRequired(true))
                .addStringOption(option => option.setName('description').setDescription('Details about the event.').setRequired(true))
                .addIntegerOption(option => option.setName('sc_reward').setDescription('Spot Coins reward.'))
                .addIntegerOption(option => option.setName('xp_reward').setDescription('Chat XP reward.'))
                .addStringOption(option => option.setName('honor_reward_id').setDescription('ID of a medal to award.').setAutocomplete(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('end').setDescription('End an event and award prizes to the winner.')
                .addStringOption(option => option.setName('id').setDescription('ID of the event to end.').setRequired(true).setAutocomplete(true))
                .addUserOption(option => option.setName('winner').setDescription('The winner of the event.').setRequired(true))),
    
    async autocomplete(interaction, db) {
        const focusedOption = interaction.options.getFocused(true);
        const guildId = interaction.guild.id;

        if (focusedOption.name === 'honor_reward_id') {
            const honorsSnapshot = await db.collection('guilds').doc(guildId).collection('honors').get();
            const honors = honorsSnapshot.docs.map(doc => ({ name: `${doc.data().emoji} ${doc.data().name}`, value: doc.id }));
            await interaction.respond(honors.filter(h => h.name.toLowerCase().includes(focusedOption.value.toLowerCase())).slice(0, 25));
        } else if (focusedOption.name === 'id') {
            const eventsSnapshot = await db.collection('guilds').doc(guildId).collection('events').get();
            const events = eventsSnapshot.docs.map(doc => ({ name: doc.data().name, value: doc.id }));
            await interaction.respond(events.filter(e => e.name.toLowerCase().includes(focusedOption.value.toLowerCase())).slice(0, 25));
        }
    },

    async execute(interaction, db) {
        await interaction.deferReply({ ephemeral: true });
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        if (subcommand === 'create') {
            const eventId = interaction.options.getString('id').toLowerCase();
            const eventData = {
                name: interaction.options.getString('name'),
                description: interaction.options.getString('description'),
                rewards: {
                    sc: interaction.options.getInteger('sc_reward') || 0,
                    xp: interaction.options.getInteger('xp_reward') || 0,
                    honor: interaction.options.getString('honor_reward_id') || null,
                },
                isActive: true,
                createdAt: new Date(),
            };
            await db.collection('guilds').doc(guildId).collection('events').doc(eventId).set(eventData);
            await interaction.editReply({ embeds: [createSuccessEmbed(`Event "${eventData.name}" created with ID \`${eventId}\`.`)] });

        } else if (subcommand === 'end') {
            const eventId = interaction.options.getString('id');
            const winner = interaction.options.getUser('user');
            const eventRef = db.collection('guilds').doc(guildId).collection('events').doc(eventId);
            const eventDoc = await eventRef.get();

            if (!eventDoc.exists) {
                return interaction.editReply({ embeds: [createErrorEmbed(`Event with ID \`${eventId}\` not found.`)] });
            }

            const eventData = eventDoc.data();
            const userRef = db.collection('users').doc(`${guildId}-${winner.id}`);

            const updates = {};
            if (eventData.rewards.sc > 0) updates.spotCoins = FieldValue.increment(eventData.rewards.sc);
            if (eventData.rewards.xp > 0) updates.chatXp = FieldValue.increment(eventData.rewards.xp);
            if (eventData.rewards.honor) updates.honors = FieldValue.arrayUnion(eventData.rewards.honor);
            
            await userRef.set(updates, { merge: true });
            await eventRef.update({ isActive: false });
            
            await interaction.editReply({ embeds: [createSuccessEmbed(`Event "${eventData.name}" has ended. Prizes awarded to ${winner.username}.`)] });
        }
    },
};