// commands/fun/satvik.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { generateProgressBar } = require('../../utils/cardGenerator');

function getSeededRandom(seed) { let x = Math.sin(seed) * 10000; return x - Math.floor(x); }

module.exports = {
    category: 'fun',
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

            let deductions = [];

            // Fetch user data for lewd command count
            const userDocRef = db.collection('users').doc(`${interaction.guild.id}-${targetUser.id}`);
            const userDoc = await userDocRef.get();
            
            if (userDoc.exists && userDoc.data().lewdCommandCount) {
                const lewdCount = userDoc.data().lewdCommandCount;
                if (lewdCount > 0) {
                    const lewdDeduction = lewdCount * 3; // Deduct 3% per lewd command
                    purity -= lewdDeduction;
                    deductions.push(`Used lewd commands (-${lewdDeduction}%)`);
                }
            }

            // Random Slanders
            const slanderSeed = parseInt(targetUser.id.slice(-2)) + timeSeed;
            if (getSeededRandom(slanderSeed) > 0.75) { // 25% chance of slander
                const slanderAmount = Math.floor(getSeededRandom(slanderSeed * 2) * 15) + 5;
                purity -= slanderAmount;
                deductions.push(`Random slander (-${slanderAmount}%)`);
            }

            // Ensure purity is not below 0
            purity = Math.max(0, purity);
            
            const progressBar = generateProgressBar(purity, 10, '😇', '😈');
            
            const embed = new EmbedBuilder()
                .setColor('#FFFFFF')
                .setAuthor({ name: `Purity Scanner: ${targetUser.username}`, iconURL: targetUser.displayAvatarURL() })
                .addFields(
                    { name: 'Satvik Level', value: `${purity}%` },
                    { name: 'Purity Meter', value: `${progressBar}` }
                );

            if (deductions.length > 0) {
                embed.setFooter({ text: `Deductions: ${deductions.join(', ')}` });
            } else {
                embed.setFooter({ text: 'A pure soul... for now.' });
            }
        
            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: 'My purity scanner exploded trying to read this user. Try again later.' });
        }
    },
};
