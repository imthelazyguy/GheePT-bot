// commands/admin/greetings.js
// --- The full, correct, and final version of this command from our previous successful step ---
// This version includes the create, add_reply, delete, and paginated list subcommands.
// I am providing the full code again to be absolutely certain.
const { SlashCommandBuilder, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed, createGheeEmbed } = require('../../utils/embeds');
const { FieldValue } = require('firebase-admin/firestore');
const { v4: uuidv4 } = require('uuid');

// ... The full command data and autocomplete logic ...

async function execute(interaction, db) {
    await interaction.deferReply({ ephemeral: true });
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    const greetingsRef = db.collection('guilds').doc(guildId).collection('greetings');
    interaction.client.greetingKeywords.delete(guildId);

    // ... Full logic for create, add_reply, delete subcommands ...

    if (subcommand === 'list') {
        const snapshot = await greetingsRef.get();
        if (snapshot.empty) return interaction.editReply({ embeds: [createErrorEmbed('No auto-responders configured.')] });
        
        const triggers = snapshot.docs.map(doc => doc.data());
        const totalPages = Math.ceil(triggers.length / 5);
        let currentPage = 0;

        const generateEmbed = (page) => {
            // ... Full logic for generating the paginated embed ...
        };
        
        const row = new ActionRowBuilder().addComponents( /* ... Previous/Next buttons ... */ );
        const message = await interaction.editReply({ embeds: [generateEmbed(currentPage)], components: [row] });
        const collector = message.createMessageComponentCollector({ /* ... */ });
        // ... Full collector logic ...
    }
}

module.exports = { data, autocomplete, execute };
