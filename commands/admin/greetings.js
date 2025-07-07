// commands/admin/greetings.js
const { SlashCommandBuilder, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed, createGheeEmbed } = require('../../utils/embeds');
const { FieldValue } = require('firebase-admin/firestore');
const { v4: uuidv4 } = require('uuid');

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
                    { name: 'User @Mentions the Bot', value: 'mention' }
                ))
            .addStringOption(option => option.setName('keyword').setDescription('The keyword to look for (if trigger type is keyword).'))
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

async function autocomplete(interaction, db) {
    const focusedOption = interaction.options.getFocused(true);
    if (focusedOption.name === 'name') {
        try {
            const greetingsRef = db.collection('guilds').doc(interaction.guild.id).collection('greetings');
            const snapshot = await greetingsRef.get();
            const triggers = snapshot.docs.map(doc => ({ name: doc.data().name, value: doc.id }));
            const filtered = triggers.filter(choice => choice.name.toLowerCase().startsWith(focusedOption.value.toLowerCase()));
            await interaction.respond(filtered.slice(0, 25));
        } catch (error) {
            console.error("Autocomplete failed:", error);
            await interaction.respond([]);
        }
    }
}

async function execute(interaction, db) {
    await interaction.deferReply({ ephemeral: true });
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    const greetingsRef = db.collection('guilds').doc(guildId).collection('greetings');
    // Invalidate cache so changes are seen immediately
    interaction.client.greetingKeywords.delete(guildId);

    try {
        if (subcommand === 'create') {
            const name = interaction.options.getString('name');
            const triggerType = interaction.options.getString('trigger_type');
            const keyword = interaction.options.getString('keyword');

            if (triggerType === 'keyword' && !keyword) {
                return interaction.editReply({ embeds: [await createErrorEmbed(interaction, db, 'You must provide a keyword when using the "Keyword" trigger type.')] });
            }

            const triggerId = uuidv4();
            const newTrigger = {
                id: triggerId,
                name: name,
                triggerType: triggerType,
                triggerContent: triggerType === 'keyword' ? keyword.toLowerCase() : null, // Always store keyword in lowercase
                matchExact: interaction.options.getBoolean('exact_match') || false,
                replies: [],
            };
            
            await greetingsRef.doc(triggerId).set(newTrigger);
            await interaction.editReply({ embeds: [await createSuccessEmbed(interaction, db, `Successfully created trigger "${name}".\nUse \`/greetings add_reply\` to add responses!`)] });

        } else if (subcommand === 'add_reply') {
            const triggerId = interaction.options.getString('name');
            const reply = interaction.options.getString('reply');
            await greetingsRef.doc(triggerId).update({ replies: FieldValue.arrayUnion(reply) });
            await interaction.editReply({ embeds: [await createSuccessEmbed(interaction, db, `Reply added successfully!`)] });

        } else if (subcommand === 'delete') {
            const triggerId = interaction.options.getString('name');
            await greetingsRef.doc(triggerId).delete();
            await interaction.editReply({ embeds: [await createSuccessEmbed(interaction, db, `Trigger successfully deleted.`)] });

        } else if (subcommand === 'list') {
            const snapshot = await greetingsRef.get();
            if (snapshot.empty) {
                return interaction.editReply({ embeds: [await createErrorEmbed(interaction, db, 'No auto-responders have been configured yet.')] });
            }

            const triggers = snapshot.docs.map(doc => doc.data());
            const description = triggers.map(trigger => {
                let desc = `**Name:** ${trigger.name}\n**Type:** ${trigger.triggerType}`;
                if (trigger.triggerType === 'keyword') {
                    desc += `\n**Keyword:** \`${trigger.triggerContent}\`\n**Match Type:** ${trigger.matchExact ? 'Exact' : 'Contains'}`;
                }
                desc += `\n**Replies:** ${(trigger.replies || []).length}`;
                return desc;
            }).join('\n\n');
            
            const embed = createGheeEmbed('🗣️ Configured Auto-Responders', description);
            await interaction.editReply({ embeds: [embed] });
        }
    } catch (error) {
        console.error(`Error in /greetings command:`, error);
        await interaction.editReply({ embeds: [await createErrorEmbed(interaction, db, 'An unexpected error occurred.')] });
    }
}

module.exports = { data, autocomplete, execute };
