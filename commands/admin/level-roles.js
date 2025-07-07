// commands/admin/level-roles.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed, createGheeEmbed } = require('../../utils/embeds');

module.exports = {
    category: 'admin',
    data: new SlashCommandBuilder()
        .setName('level-roles')
        .setDescription('Manage roles awarded for leveling up.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand => subcommand
            .setName('add').setDescription('Add a new role reward for a specific level.')
            .addIntegerOption(option => option.setName('level').setDescription('The level required to get this role.').setRequired(true).setMinValue(1))
            .addRoleOption(option => option.setName('role').setDescription('The role to grant.').setRequired(true)))
        .addSubcommand(subcommand => subcommand
            .setName('remove').setDescription('Remove a role reward for a specific level.')
            .addIntegerOption(option => option.setName('level').setDescription('The level whose role reward you want to remove.').setRequired(true)))
        .addSubcommand(subcommand => subcommand
            .setName('list').setDescription('Show all configured level role rewards.')),

    async execute(interaction, db) {
        await interaction.deferReply({ ephemeral: true });
        const subcommand = interaction.options.getSubcommand();
        const levelRolesRef = db.collection('guilds').doc(interaction.guild.id).collection('level-roles');

        if (subcommand === 'add') {
            const level = interaction.options.getInteger('level');
            const role = interaction.options.getRole('role');
            
            // Prevent setting a reward for a role higher than the bot's own role
            if (role.position >= interaction.guild.members.me.roles.highest.position) {
                return interaction.editReply({ embeds: [await createErrorEmbed(interaction, db, `I cannot manage the **${role.name}** role because it is higher than or equal to my own role.`)] });
            }

            await levelRolesRef.doc(level.toString()).set({
                level: level,
                roleId: role.id,
                roleName: role.name
            });
            return interaction.editReply({ embeds: [await createSuccessEmbed(interaction, db, `Users will now receive the **${role.name}** role upon reaching **Level ${level}**.`)] });
        }
        
        if (subcommand === 'remove') {
            const level = interaction.options.getInteger('level');
            const docRef = levelRolesRef.doc(level.toString());
            const doc = await docRef.get();

            if (!doc.exists) {
                return interaction.editReply({ embeds: [await createErrorEmbed(interaction, db, `There is no role reward configured for **Level ${level}**.`)] });
            }
            await docRef.delete();
            return interaction.editReply({ embeds: [await createSuccessEmbed(interaction, db, `The role reward for **Level ${level}** has been removed.`)] });
        }

        if (subcommand === 'list') {
            const snapshot = await levelRolesRef.orderBy('level').get();
            if (snapshot.empty) {
                return interaction.editReply({ embeds: [await createErrorEmbed(interaction, db, 'No level role rewards have been configured.')] });
            }

            const description = snapshot.docs.map(doc => {
                const data = doc.data();
                return `**Level ${data.level}** → <@&${data.roleId}>`;
            }).join('\n');

            const embed = createGheeEmbed('⚜️ Level Role Rewards', description);
            return interaction.editReply({ embeds: [embed] });
        }
    },
};
