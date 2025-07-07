// commands/fun/ship.js
const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const { generateProgressBar, generateShipImage } = require('../../utils/cardGenerator');

module.exports = {
    category: 'fun',
    data: new SlashCommandBuilder()
        .setName('ship')
        .setDescription('Ship two people together!')
        .addUserOption(opt => opt.setName('user1').setDescription('First user').setRequired(true))
        .addUserOption(opt => opt.setName('user2').setDescription('Second user').setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();
        const user1 = interaction.options.getUser('user1');
        const user2 = interaction.options.getUser('user2');

        const ids = [user1.id, user2.id].sort();
        const combinedSeed = parseInt(ids[0].slice(-5)) + parseInt(ids[1].slice(-5));
        let x = Math.sin(combinedSeed) * 10000;
        const shipPercent = Math.round((x - Math.floor(x)) * 100);

        const progressBar = generateProgressBar(shipPercent, 10, '🟥', '⬛');
        
        const avatarBuffer = await generateShipImage(
            user1.displayAvatarURL({ extension: 'png', size: 128 }),
            user2.displayAvatarURL({ extension: 'png', size: 128 })
        );

        const attachment = new AttachmentBuilder(avatarBuffer, { name: 'ship-image.png' });

        const embed = new EmbedBuilder()
            .setTitle(`💘 Shipping ${user1.username} + ${user2.username}`)
            .setDescription(`**Compatibility:** ${shipPercent}%\n${progressBar}`)
            .setColor('#FF69B4')
            .setImage('attachment://ship-image.png');

        await interaction.editReply({ embeds: [embed], files: [attachment] });
    },
};
