// utils/cardGenerator.js
const fetch = require('node-fetch');

// This function communicates with the QuickChart API
async function createCardWithAPI(config) {
    const url = 'https://quickchart.io/chart/create';
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chart: config,
                backgroundColor: '#2C2F33',
                width: 600,
                height: 250,
                format: 'png',
            }),
        });
        const json = await response.json();
        if (!json.success) throw new Error(`QuickChart API Error: ${json.error}`);
        return json.url;
    } catch (error) {
        console.error("Failed to create card with QuickChart API:", error);
        return null;
    }
}

// ... (Your existing generateProgressBar and generateShipImage functions remain here) ...
function generateProgressBar(percentage, totalBlocks = 10, filledEmoji = '▰', emptyEmoji = '▱') {
    const filledCount = Math.round((percentage / 100) * totalBlocks);
    const emptyCount = totalBlocks - filledCount;
    return filledEmoji.repeat(filledCount) + emptyEmoji.repeat(emptyCount);
}

async function generateShipImage(avatarURL1, avatarURL2) { /* ... existing code ... */ }


// --- NEW LEVEL UP CARD GENERATOR ---
async function createLevelUpCard(member, oldLevel, newLevel, totalXp, rank) {
    const avatarUrl = member.user.displayAvatarURL({ extension: 'png', size: 128 });
    const { getXpForLevel } = require('./leveling');
    
    // Calculate XP needed for the previous and next levels to create the progress bar
    const xpForOldLevel = getXpForLevel(newLevel - 1);
    const xpForNextLevel = getXpForLevel(newLevel);
    const progressXp = totalXp - xpForOldLevel;
    const requiredXpForThisLevel = xpForNextLevel - xpForOldLevel;
    const percentage = Math.max(0, Math.min(100, (progressXp / requiredXpForThisLevel) * 100));

    const chartConfig = {
        type: 'bar',
        data: {
            labels: [''],
            datasets: [{ data: [percentage], backgroundColor: '#00FF7F', borderWidth: 0, barPercentage: 1 }]
        },
        options: {
            plugins: {
                datalabels: { display: false },
                chartJsPluginAnnotation: {
                    annotations: [{
                        type: 'label', content: 'LEVEL UP!', font: { size: 40, family: 'sans-serif', weight: 'bold' }, color: '#FFFFFF', position: { x: '210px', y: '25px' }
                    }, {
                        type: 'label', content: `${member.user.username}`, font: { size: 24, family: 'sans-serif'}, color: '#B9BBBE', position: { x: '210px', y: '65px' }
                    }, {
                        type: 'label', content: `LEVEL ${oldLevel} ➔ LEVEL ${newLevel}`, font: { size: 32, family: 'sans-serif', weight: 'bold' }, color: '#00FF7F', position: { x: '350px', y: '130px' }
                    }, {
                        type: 'label', content: `Rank: #${rank}`, font: { size: 18, family: 'sans-serif' }, color: 'white', position: { x: '100px', y: '215px' }
                    }, {
                        type: 'label', content: `Total XP: ${totalXp.toLocaleString()}`, font: { size: 18, family: 'sans-serif' }, color: 'white', position: { x: '350px', y: '215px' }
                    }]
                }
            },
            chartArea: { backgroundColor: `url(${avatarUrl})` },
            layout: { padding: { left: 180, right: 20, top: 10, bottom: 10 } },
            scales: { x: { display: false, min: 0, max: 100 }, y: { display: false } },
            legend: { display: false },
        }
    };

    return await createCardWithAPI(chartConfig);
}

module.exports = { generateProgressBar, generateShipImage, createLevelUpCard };
