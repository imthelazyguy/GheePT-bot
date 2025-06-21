// commands/admin/setup_age_roles.js
const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createGheeEmbed, createErrorEmbed } = require('../../utils/embeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup_age_roles')
        .setDescription('Creates the age verification message with buttons.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction, db) {
        const configDoc = await db.collection('guilds').doc(interaction.guild.id).get();
        if (!configDoc.exists || !configDoc.data().roleId18Plus || !configDoc.data().roleIdUnder18) {
            return interaction.reply({ embeds: [createErrorEmbed('Please configure the 18+ and Under 18 roles using `/config roles set` first.')], ephemeral: true });
        }

        const embed = createGheeEmbed('Age Verification', 'Please select your age group to gain full access to the server. This helps us keep the community safe and properly curated.');
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('age_verify_18_plus').setLabel('18+').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('age_verify_under_18').setLabel('Under 18').setStyle(ButtonStyle.Secondary)
        );

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: 'Age verification message posted.', ephemeral: true });
    },
};