// commands/admin/greetings.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed, createGheeEmbed } = require('../../utils/embeds');
const { FieldValue } = require('firebase-admin/firestore');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('greetings')
        .setDescription('Manage the casual response system. (Admin Only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a new keyword and a punny/edgy reply.')
                .addStringOption(option => option.setName('keyword').setDescription('The keyword to listen for (e.g., "hello").').setRequired(true))
                .addStringOption(option => option.setName('reply').setDescription('The reply GheePT should give.').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a specific reply from a keyword.')
                .addStringOption(option => option.setName('keyword').setDescription('The keyword to modify.').setRequired(true).setAutocomplete(true))
                .addStringOption(option => option.setName('reply').setDescription('The exact reply to remove.').setRequired(true).setAutocomplete(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all configured keywords and their replies.')),

    async autocomplete(interaction, db) {
        const focusedOption = interaction.options.getFocused(true);
        const guildId = interaction.guild.id;
        const greetingsRef = db.collection('guilds').doc(guildId).collection('greetings');

        if (focusedOption.name === 'keyword') {
            const snapshot = await greetingsRef.get();
            const keywords = snapshot.docs.map(doc => doc.id);
            const filtered = keywords.filter(choice => choice.startsWith(focusedOption.value));
            await interaction.respond(filtered.map(choice => ({ name: choice, value: choice })));
        }

        if (focusedOption.name === 'reply') {
            const keyword = interaction.options.getString('keyword');
            if (!keyword) return;

            const keywordDoc = await greetingsRef.doc(keyword).get();
            if (!keywordDoc.exists || !keywordDoc.data().replies) {
                return interaction.respond([]);
            }

            const replies = keywordDoc.data().replies;
            const filtered = replies.filter(choice => choice.startsWith(focusedOption.value));
            await interaction.respond(filtered.map(choice => ({ name: choice, value: choice })));
        }
    },

    async execute(interaction, db) {
        await interaction.deferReply({ ephemeral: true });
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;
        const greetingsRef = db.collection('guilds').doc(guildId).collection('greetings');
        interaction.client.greetingKeywords.delete(guildId); // Invalidate cache

        if (subcommand === 'add') {
            const keyword = interaction.options.getString('keyword').toLowerCase();
            const reply = interaction.options.getString('reply');
            const keywordRef = greetingsRef.doc(keyword);

            try {
                await keywordRef.set({
                    replies: FieldValue.arrayUnion(reply)
                }, { merge: true });
                await interaction.editReply({ embeds: [createSuccessEmbed(`Added reply to keyword \`${keyword}\`.`)] });
            } catch (error) {
                console.error('Failed to add greeting:', error);
                await interaction.editReply({ embeds: [createErrorEmbed('A database error occurred.')] });
            }
        } else if (subcommand === 'remove') {
            const keyword = interaction.options.getString('keyword').toLowerCase();
            const reply = interaction.options.getString('reply');
            const keywordRef = greetingsRef.doc(keyword);

            try {
                await keywordRef.update({
                    replies: FieldValue.arrayRemove(reply)
                });
                await interaction.editReply({ embeds: [createSuccessEmbed(`Removed reply from keyword \`${keyword}\`.`)] });
            } catch (error) {
                console.error('Failed to remove greeting:', error);
                await interaction.editReply({ embeds: [createErrorEmbed('A database error occurred, or the keyword/reply does not exist.')] });
            }
        } else if (subcommand === 'list') {
            try {
                const snapshot = await greetingsRef.get();
                if (snapshot.empty) {
                    return interaction.editReply({ embeds: [createErrorEmbed('No greetings have been configured yet.')] });
                }

                const embed = createGheeEmbed('🗣️ Configured Greetings', 'Here are all the keywords and replies GheePT is listening for.');
                snapshot.forEach(doc => {
                    const replies = doc.data().replies.map(r => `- "${r}"`).join('\n');
                    embed.addFields({ name: `Keyword: \`${doc.id}\``, value: replies || 'No replies.' });
                });
                await interaction.editReply({ embeds: [embed] });
            } catch (error) {
                console.error('Failed to list greetings:', error);
                await interaction.editReply({ embeds: [createErrorEmbed('A database error occurred.')] });
            }
        }
    },
};