// commands/admin/level-roles.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createGheeEmbed, createErrorEmbed, createSuccessEmbed } = require('../../utils/embeds');

module.exports = {
    category: 'admin',
    data: new SlashCommandBuilder()
        .setName('level-roles') // Renamed the command for clarity
        .setDescription('Configure roles granted at specific level milestones. (Admin Only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Set a role to be granted at a specific level.')
                .addIntegerOption(option => option.setName('level').setDescription('The level to grant the role at.').setRequired(true).setMinValue(1))
                .addRoleOption(option => option.setName('role').setDescription('The role to grant.').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a role reward for a specific level.')
                .addIntegerOption(option => option.setName('level').setDescription('The level to remove the role reward from.').setRequired(true).setMinValue(1)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Lists all configured level role rewards.')),

    async execute(interaction, db) {
        await interaction.deferReply({ ephemeral: true });
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;
        const levelRolesRef = db.collection('guilds').doc(guildId).collection('level_roles');

        if (subcommand === 'set') {
            const level = interaction.options.getInteger('level');
            const role = interaction.options.getRole('role');

            if (role.position >= interaction.guild.members.me.roles.highest.position) {
                return interaction.editReply({ embeds: [createErrorEmbed("I cannot manage this role. Please make sure my role is positioned higher than the role you are trying to set.")] });
            }

            try {
                await levelRolesRef.doc(level.toString()).set({
                    roleId: role.id,
                    roleName: role.name
                });
                await interaction.editReply({ embeds: [createSuccessEmbed(`Users will now be granted the **${role.name}** role upon reaching Level ${level}.`)] });
            } catch (error) {
                console.error('Failed to set level role:', error);
                await interaction.editReply({ embeds: [createErrorEmbed('A database error occurred.')] });
            }
        } else if (subcommand === 'remove') {
            const level = interaction.options.getInteger('level');
            try {
                await levelRolesRef.doc(level.toString()).delete();
                await interaction.editReply({ embeds: [createSuccessEmbed(`The role reward for Level ${level} has been removed.`)] });
            } catch (error) {
                console.error('Failed to remove level role:', error);
                await interaction.editReply({ embeds: [createErrorEmbed('A database error occurred.')] });
            }
        } else if (subcommand === 'list') {
            try {
                const snapshot = await levelRolesRef.get();
                if (snapshot.empty) {
                    return interaction.editReply({ embeds: [createErrorEmbed('No level role rewards have been configured yet.')] });
                }
                
                const roles = snapshot.docs
                    .map(doc => ({ level: parseInt(doc.id, 10), data: doc.data() }))
                    .sort((a, b) => a.level - b.level);

                let description = roles.map(item => `**Level ${item.level}** → <@&${item.data.roleId}>`).join('\n');
                
                const embed = createGheeEmbed('📋 Configured Level Roles', description);
                await interaction.editReply({ embeds: [embed] });
            } catch (error) {
                console.error('Failed to list level roles:', error);
                await interaction.editReply({ embeds: [createErrorEmbed('A database error occurred.')] });
            }
        }
    },
};
