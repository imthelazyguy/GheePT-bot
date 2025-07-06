// commands/admin/config.js
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');

module.exports = {
    category: 'admin',
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Configure GheePT for this server. (Admin Only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommandGroup(group => group
            .setName('channels')
            .setDescription('Configure special purpose channels.')
            // ... (Your other channel subcommands remain here) ...
        )
        // --- NEW SUBCOMMAND GROUP ---
        .addSubcommandGroup(group => group
            .setName('emoji')
            .setDescription('Set custom emojis for the bot to use.')
            .addSubcommand(subcommand =>
                subcommand.setName('set').setDescription('Set a custom emoji for a specific purpose.')
                    .addStringOption(option =>
                        option.setName('purpose')
                            .setDescription('The purpose of this emoji.')
                            .setRequired(true)
                            .addChoices(
                                { name: 'Success (e.g., ✅)', value: 'success' },
                                { name: 'Error (e.g., ❌)', value: 'error' },
                                { name: 'Loading (e.g., ⏳)', value: 'loading' }
                            ))
                    .addStringOption(option => option.setName('emoji').setDescription('The custom emoji from this server.').setRequired(true)))
            .addSubcommand(subcommand =>
                subcommand.setName('view').setDescription('View the currently configured custom emojis.')))
    ,

    async execute(interaction, db) {
        await interaction.deferReply({ ephemeral: true });
        const group = interaction.options.getSubcommandGroup();
        const guildId = interaction.guild.id;

        // ... (Your existing logic for channels, roles, etc. remains here) ...

        if (group === 'emoji') {
            const subcommand = interaction.options.getSubcommand();
            const configRef = db.collection('guilds').doc(guildId);

            if (subcommand === 'set') {
                const purpose = interaction.options.getString('purpose');
                const emojiStr = interaction.options.getString('emoji');
                
                // Validate that it's a real custom emoji from this server
                const emojiId = emojiStr.match(/<a?:.+:(\d+)>/)?.[1];
                const emoji = emojiId ? interaction.guild.emojis.cache.get(emojiId) : null;

                if (!emoji) {
                    return interaction.editReply({ embeds: [createErrorEmbed("Invalid Emoji. Please provide a custom emoji from this server.")] });
                }

                await configRef.set({
                    customEmojis: { [purpose]: emoji.toString() }
                }, { merge: true });
                
                return interaction.editReply({ embeds: [createSuccessEmbed(`The \`${purpose}\` emoji has been set to ${emoji.toString()}`)] });
            }
            if (subcommand === 'view') {
                // ... logic to fetch and display configured emojis ...
            }
        }
    },
};
