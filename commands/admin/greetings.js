// commands/admin/greetings.js
const { SlashCommandBuilder, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed, createGheeEmbed } = require('../../utils/embeds');
const { FieldValue } = require('firebase-admin/firestore');
const { v4: uuidv4 } = require('uuid');

// FIX: Define the 'data' constant correctly
const data = new SlashCommandBuilder()
    .setName('greetings')
    .setDescription('Manage the advanced auto-responder system. (Admin Only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
        subcommand.setName('create').setDescription('Create a new auto-response trigger.')
            .addStringOption(option => option.setName('name').setDescription('A unique name for this trigger (e.g., "hello-reply").').setRequired(true))
            .addStringOption(option => option.setName('trigger_type').setDescription('When should this trigger?').setRequired(true)
                .addChoices(
                    { name: 'Message includes Keyword', value: 'keyword' },
                    { name: 'User @Mentions the Bot', value: 'mention' },
                    { name: 'User Replies to the Bot', value: 'reply' }
                ))
            .addStringOption(option => option.setName('keyword').setDescription('The keyword to look for (if trigger type is keyword).'))
            .addBooleanOption(option => option.setName('case_sensitive').setDescription('Should the keyword match be case-sensitive? (Default: No)'))
            .addBooleanOption(option => option.setName('exact_match').setDescription('Must the message be an exact match to the keyword? (Default: No)')))
    .addSubcommand(subcommand =>
        subcommand.setName('add_reply').setDescription('Add a possible reply to an existing trigger.')
            .addStringOption(option => option.setName('name').setDescription('The name of the trigger to add a reply to.').setRequired(true).setAutocomplete(true))
            .addStringOption(option => option.setName('reply').setDescription('The new reply text.').setRequired(true)))
    .addSubcommand(subcommand =>
        subcommand.setName('list').setDescription('Lists all configured auto-response triggers.'))
    .addSubcommand(subcommand =>
        subcommand.setName('delete').setDescription('Deletes an entire auto-response trigger.')
            .addStringOption(option => option.setName('name').setDescription('The name of the trigger to delete.').setRequired(true).setAutocomplete(true)));

// FIX: Define the 'autocomplete' function correctly
async function autocomplete(interaction, db) {
    const focusedOption = interaction.options.getFocused(true);
    if (focusedOption.name === 'name') {
        const greetingsRef = db.collection('guilds').doc(interaction.guild.id).collection('greetings');
        const snapshot = await greetingsRef.get();
        // Use the trigger name for the choice name, and the document ID for the value
        const triggers = snapshot.docs.map(doc => ({ name: doc.data().name, value: doc.id }));
        const filtered = triggers.filter(choice => choice.name.toLowerCase().startsWith(focusedOption.value.toLowerCase()));
        await interaction.respond(filtered.slice(0, 25));
    }
}

// FIX: Define the 'execute' function correctly
async function execute(interaction, db) {
    await interaction.deferReply({ ephemeral: true });
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    const greetingsRef = db.collection('guilds').doc(guildId).collection('greetings');
    // Invalidate cache so changes are seen immediately
    interaction.client.greetingKeywords.delete(guildId);

    if (subcommand === 'create') {
        const name = interaction.options.getString('name');
        const triggerType = interaction.options.getString('trigger_type');
        const keyword = interaction.options.getString('keyword');

        if (triggerType === 'keyword' && !keyword) {
            return interaction.editReply({ embeds: [createErrorEmbed('You must provide a keyword when using the "Keyword" trigger type.')] });
        }

        const triggerId = uuidv4();
        const newTrigger = {
            id: triggerId,
            name: name,
            triggerType: triggerType,
            triggerContent: triggerType === 'keyword' ? keyword : null,
            matchOptions: {
                isCaseSensitive: interaction.options.getBoolean('case_sensitive') || false,
                isExactMatch: interaction.options.getBoolean('exact_match') || false,
            },
            replies: [],
        };
        
        await greetingsRef.doc(triggerId).set(newTrigger);
        await interaction.editReply({ embeds: [createSuccessEmbed(`Successfully created new auto-responder trigger named "${name}".\nNow use \`/greetings add_reply\` to add some responses!`)] });

    } else if (subcommand === 'add_reply') {
        const triggerId = interaction.options.getString('name'); // This will be the document ID from autocomplete
        const reply = interaction.options.getString('reply');
        const triggerRef = greetingsRef.doc(triggerId);

        await triggerRef.update({ replies: FieldValue.arrayUnion(reply) });
        await interaction.editReply({ embeds: [createSuccessEmbed(`Reply added successfully!`)] });

    } else if (subcommand === 'delete') {
        const triggerId = interaction.options.getString('name');
        await greetingsRef.doc(triggerId).delete();
        await interaction.editReply({ embeds: [createSuccessEmbed(`Trigger successfully deleted.`)] });

    } else if (subcommand === 'list') {
        const snapshot = await greetingsRef.get();
        if (snapshot.empty) {
            return interaction.editReply({ embeds: [createErrorEmbed('No auto-responders have been configured yet.')] });
        }

        const triggers = snapshot.docs.map(doc => doc.data());
        const totalPages = Math.ceil(triggers.length / 5);
        let currentPage = 0;

        const generateEmbed = (page) => {
            const start = page * 5;
            const end = start + 5;
            const currentTriggers = triggers.slice(start, end);

            const embed = createGheeEmbed(`🗣️ Configured Auto-Responders (Page ${page + 1}/${totalPages})`, '');
            
            if (currentTriggers.length === 0) {
                 embed.setDescription("No triggers on this page.");
            } else {
                currentTriggers.forEach(trigger => {
                    let description = `**Type:** ${trigger.triggerType}`;
                    if (trigger.triggerType === 'keyword') {
                        description += `\n**Keyword:** \`${trigger.triggerContent}\``;
                        description += `\n**Options:** Case-Sensitive: ${trigger.matchOptions.isCaseSensitive}, Exact-Match: ${trigger.matchOptions.isExactMatch}`;
                    }
                    description += `\n**Replies:** ${(trigger.replies || []).length} configured.`;
                    embed.addFields({ name: `Name: ${trigger.name}`, value: description });
                });
            }
            return embed;
        };
        
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('prev_page').setLabel('Previous').setStyle(ButtonStyle.Primary).setDisabled(true),
            new ButtonBuilder().setCustomId('next_page').setLabel('Next').setStyle(ButtonStyle.Primary).setDisabled(totalPages <= 1)
        );

        const message = await interaction.editReply({ embeds: [generateEmbed(currentPage)], components: [row] });
        const collector = message.createMessageComponentCollector({ filter: i => i.user.id === interaction.user.id, time: 2 * 60 * 1000 });

        collector.on('collect', async i => {
            if (i.customId === 'next_page' && currentPage < totalPages - 1) {
                currentPage++;
            } else if (i.customId === 'prev_page' && currentPage > 0) {
                currentPage--;
            }
            
            row.components[0].setDisabled(currentPage === 0);
            row.components[1].setDisabled(currentPage >= totalPages - 1);
            
            await i.update({ embeds: [generateEmbed(currentPage)], components: [row] });
        });

        collector.on('end', () => message.edit({ content: 'This interaction has expired.', components: [] }).catch(console.error));
    }
}

// FIX: Export the correctly defined constants
module.exports = {
    data,
    autocomplete,
    execute,
};
