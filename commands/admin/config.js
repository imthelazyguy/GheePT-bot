// commands/admin/config.js
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Configure GheePT for this server. (Admin Only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommandGroup(group => group
            .setName('channels')
            .setDescription('Configure special purpose channels.')
            .addSubcommand(subcommand => subcommand
                .setName('set')
                .setDescription('Set a special purpose channel.')
                .addStringOption(option =>
                    option.setName('purpose')
                        .setDescription('The purpose of this channel.')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Meme Channel', value: 'memeChannelId' },
                            { name: 'Hall of Fame', value: 'hallOfFameChannelId' },
                            { name: 'GheeDrop Event Channel', value: 'gheeDropChannelId' },
                            { name: 'Mod Log Channel', value: 'modLogChannelId' },
                            { name: 'Level Up Announcement Channel', value: 'levelUpChannelId' } // <-- NEW OPTION
                        ))
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The text channel to set.')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)))
            .addSubcommand(subcommand => subcommand
                .setName('set_lewd')
                .setDescription('Designate a channel where lewd commands are permitted.')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel to mark as lewd-enabled.')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)))
        )
        // ... (The rest of your subcommands like 'roles' and 'gheedrop' remain unchanged)
    ,

    async execute(interaction, db) {
        await interaction.deferReply({ ephemeral: true });

        const group = interaction.options.getSubcommandGroup();
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        try {
            if (group === 'channels') {
                const channel = interaction.options.getChannel('channel');
                if (subcommand === 'set') {
                    const purpose = interaction.options.getString('purpose');
                    await db.collection('guilds').doc(guildId).set({ [purpose]: channel.id }, { merge: true });
                    const embed = createSuccessEmbed(`The \`${purpose.replace('Id', '')}\` has been set to ${channel}.`);
                    await interaction.editReply({ embeds: [embed] });
                } else if (subcommand === 'set_lewd') {
                    await db.collection('guilds').doc(guildId).collection('lewd_channels').doc(channel.id).set({ name: channel.name });
                    const embed = createSuccessEmbed(`${channel} is now a lewd-enabled channel.`);
                    await interaction.editReply({ embeds: [embed] });
                }
            } 
            // ... (The logic for your other command groups remains unchanged)
            else {
                 await interaction.editReply({ embeds: [createErrorEmbed("This command group is not yet implemented.")] });
            }
        } catch (error) {
            console.error(`Error in /config command for guild ${guildId}:`, error);
            const embed = createErrorEmbed(`A database error occurred. Please try again later.`);
            await interaction.editReply({ embeds: [embed] });
        }
    },
};