// commands/admin/honors.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createGheeEmbed, createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds');
const { FieldValue } = require('firebase-admin/firestore');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('honors')
        .setDescription('Manage the Medals of Honor system. (Admin Only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand.setName('create').setDescription('Create a new medal.')
                .addStringOption(option => option.setName('id').setDescription('Unique ID (e.g., "top_chatter_s1").').setRequired(true))
                .addStringOption(option => option.setName('emoji').setDescription('The emoji for the medal.').setRequired(true))
                .addStringOption(option => option.setName('name').setDescription('The name of the medal.').setRequired(true))
                .addStringOption(option => option.setName('description').setDescription('How this medal is earned.').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('grant').setDescription('Grant a medal to a user.')
                .addUserOption(option => option.setName('user').setDescription('The user to grant the medal to.').setRequired(true))
                .addStringOption(option => option.setName('id').setDescription('The ID of the medal to grant.').setRequired(true).setAutocomplete(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('revoke').setDescription('Revoke a medal from a user.')
                .addUserOption(option => option.setName('user').setDescription('The user to revoke the medal from.').setRequired(true))
                .addStringOption(option => option.setName('id').setDescription('The ID of the medal to revoke.').setRequired(true).setAutocomplete(true))),

    async autocomplete(interaction, db) {
        const focusedOption = interaction.options.getFocused(true);
        if (focusedOption.name === 'id') {
            const honorsSnapshot = await db.collection('guilds').doc(interaction.guild.id).collection('honors').get();
            const honors = honorsSnapshot.docs.map(doc => ({ name: `${doc.data().emoji} ${doc.data().name}`, value: doc.id }));
            const filtered = honors.filter(choice => choice.name.toLowerCase().includes(focusedOption.value.toLowerCase()));
            await interaction.respond(filtered.slice(0, 25));
        }
    },
    
    async execute(interaction, db) {
        await interaction.deferReply({ ephemeral: true });
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        if (subcommand === 'create') {
            const id = interaction.options.getString('id').toLowerCase();
            const emoji = interaction.options.getString('emoji');
            const name = interaction.options.getString('name');
            const description = interaction.options.getString('description');
            
            await db.collection('guilds').doc(guildId).collection('honors').doc(id).set({ emoji, name, description });
            await interaction.editReply({ embeds: [createSuccessEmbed(`Medal "${emoji} ${name}" created with ID \`${id}\`.`)] });
        } else if (subcommand === 'grant') {
            const user = interaction.options.getUser('user');
            const id = interaction.options.getString('id');
            const userRef = db.collection('users').doc(`${guildId}-${user.id}`);
            await userRef.set({ honors: FieldValue.arrayUnion(id) }, { merge: true });
            await interaction.editReply({ embeds: [createSuccessEmbed(`Granted medal \`${id}\` to ${user.username}.`)] });
        } else if (subcommand === 'revoke') {
            const user = interaction.options.getUser('user');
            const id = interaction.options.getString('id');
            const userRef = db.collection('users').doc(`${guildId}-${user.id}`);
            await userRef.update({ honors: FieldValue.arrayRemove(id) });
            await interaction.editReply({ embeds: [createSuccessEmbed(`Revoked medal \`${id}\` from ${user.username}.`)] });
        }
    },
};