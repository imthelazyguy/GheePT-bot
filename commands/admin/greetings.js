// commands/admin/greetings.js
const { SlashCommandBuilder, PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { createErrorEmbed, createSuccessEmbed, createGheeEmbed } = require('../../utils/embeds');
const { FieldValue } = require('firebase-admin/firestore');
const { v4: uuidv4 } = require('uuid');

module.exports = {
    // ... data and autocomplete properties remain the same
    
    async execute(interaction, db) {
        // ... create, add_reply, and delete subcommand logic remains the same

        if (subcommand === 'list') {
            const snapshot = await greetingsRef.get();
            if (snapshot.empty) {
                return interaction.editReply({ embeds: [createErrorEmbed('No auto-responders have been configured yet.')] });
            }

            const triggers = snapshot.docs.map(doc => doc.data());
            const totalPages = Math.ceil(triggers.length / 5); // Show 5 triggers per page
            let currentPage = 0;

            const generateEmbed = (page) => {
                const start = page * 5;
                const end = start + 5;
                const currentTriggers = triggers.slice(start, end);

                const embed = createGheeEmbed(`🗣️ Configured Auto-Responders (Page ${page + 1}/${totalPages})`, '');
                
                currentTriggers.forEach(trigger => {
                    let description = `**Type:** ${trigger.triggerType}`;
                    if (trigger.triggerType === 'keyword') {
                        description += `\n**Keyword:** \`${trigger.triggerContent}\``;
                    }
                    description += `\n**Replies:** ${(trigger.replies || []).length} configured.`;
                    embed.addFields({ name: `Name: ${trigger.name}`, value: description });
                });
                return embed;
            };
            
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('prev_page').setLabel('Previous').setStyle(ButtonStyle.Primary).setDisabled(true),
                new ButtonBuilder().setCustomId('next_page').setLabel('Next').setStyle(ButtonStyle.Primary).setDisabled(totalPages <= 1)
            );

            const message = await interaction.editReply({ embeds: [generateEmbed(currentPage)], components: [row] });
            const collector = message.createMessageComponentCollector({ filter: i => i.user.id === interaction.user.id, time: 60000 });

            collector.on('collect', async i => {
                if (i.customId === 'next_page') {
                    currentPage++;
                } else if (i.customId === 'prev_page') {
                    currentPage--;
                }
                
                row.components[0].setDisabled(currentPage === 0);
                row.components[1].setDisabled(currentPage >= totalPages - 1);
                
                await i.update({ embeds: [generateEmbed(currentPage)], components: [row] });
            });

            collector.on('end', () => message.edit({ components: [] }).catch(console.error));
        }
    },
};
