// commands/fun/satvik.js
const { SlashCommandBuilder } = require('discord.js');
const { createGheeEmbed } = require('../../utils/embeds');

function getSeededRandom(seed) {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('satvik')
        .setDescription('How pure and virtuous are you? GheePT investigates.')
        .addUserOption(option => option.setName('user').setDescription('The user to investigate')),

    async execute(interaction, db) {
        await interaction.deferReply();
        const targetUser = interaction.options.getUser('user') || interaction.user;

        try {
            // Base Purity calculation 
            const timeSeed = Math.floor(Date.now() / (1000 * 60 * 60 * 12));
            const combinedSeed = parseInt(targetUser.id.slice(-7)) + timeSeed;
            let purity = Math.floor(getSeededRandom(combinedSeed) * 51) + 50; // Base purity starts at 50-100%

            // --- Factors for Deduction ---
            const userDocRef = db.collection('users').doc(`${interaction.guild.id}-${targetUser.id}`);
            const userDoc = await userDocRef.get();
            
            // 1. Lewd Command Counter 
            if (userDoc.exists && userDoc.data().lewdCommandCount) {
                purity -= userDoc.data().lewdCommandCount * 2;
            }

            // 2. Random Slanders 
            const slanderSeed = parseInt(targetUser.id.slice(-2)) + timeSeed;
            if (getSeededRandom(slanderSeed) > 0.75) {
                const slanderAmount = Math.floor(getSeededRandom(slanderSeed * 2) * 15) + 5;
                purity -= slanderAmount;
            }

            purity = Math.max(0, purity); // Ensure purity is not below 0
            
            const responseMessage = `GheePT's purity scanner is confused. Your Satvik level is fluctuating wildly.\n\nAfter intense analysis, **${targetUser.username}** is **${purity}%** pure.\n\n*Blame the lewd commands... and maybe a rogue samosa.*`; // 
            
            const embed = createGheeEmbed('😇 Purity Scanner', responseMessage);
            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error(`Error in /satvik command for user ${targetUser.id}:`, error);
            await interaction.editReply({ embeds: [createErrorEmbed('Could not calculate purity due to a database error.')]});
        }
    },
};