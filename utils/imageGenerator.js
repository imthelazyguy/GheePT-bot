// utils/imageGenerator.js
const fetch = require('node-fetch');

// This function creates a URL that asks the QuickChart API to render our card.
async function createCardWithAPI(config) {
    const url = 'https://quickchart.io/chart/create';
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chart: config,
                backgroundColor: '#23272A', // Our dark theme background
                width: 400,
                height: 150,
                format: 'png',
            }),
        });
        const json = await response.json();
        // The API returns a URL to the finished image
        return json.url;
    } catch (error) {
        console.error("Failed to create card with QuickChart API:", error);
        return null;
    }
}

// We define a template for our /pp card
async function createPPCard(user, size) {
    const chartConfig = {
        type: 'bar', // We're cleverly using a bar chart as a progress bar
        data: {
            labels: [''], // No label needed for a single bar
            datasets: [{
                data: [(size / 12) * 100], // The size as a percentage
                backgroundColor: '#FFD700', // Ghee Gold
                borderColor: '#FFD700',
                borderWidth: 1,
                barPercentage: 1.0,
                categoryPercentage: 1.0,
            }]
        },
        options: {
            plugins: {
                // This is how we add the text and avatar
                chartJsPluginAnnotation: {
                    annotations: [
                        {
                            type: 'box',
                            xMin: 20, xMax: 120, yMin: 25, yMax: 125,
                            backgroundColor: 'rgba(0,0,0,0)',
                            borderColor: 'rgba(0,0,0,0)',
                        },
                        {
                            type: 'label',
                            content: `${user.username}'s pp`,
                            font: { size: 24, family: 'sans-serif' },
                            color: '#FFFFFF',
                            xValue: 140, yValue: 50,
                            xAdjust: -80, yAdjust: 40,
                        },
                        {
                            type: 'label',
                            content: `${size} inches`,
                            font: { size: 18, family: 'sans-serif' },
                            color: '#AAAAAA',
                            xValue: 140, yValue: 125,
                            xAdjust: -75, yAdjust: 0
                        }
                    ]
                },
                legend: { display: false },
                title: { display: false },
            },
            scales: {
                x: { display: false, min: 0, max: 100 },
                y: { display: false }
            },
            // This places the progress bar correctly
            indexAxis: 'y',
            layout: {
                padding: { left: 140, right: 20, top: 70, bottom: 50 }
            }
        }
    };
    
    // We can't directly draw the avatar, so we'll put it in the final Discord embed
    const imageUrl = await createCardWithAPI(chartConfig);
    return imageUrl;
}

// You can create similar functions for /horny, /gay etc.
// by copying createPPCard and changing the text content.

module.exports = { createPPCard };
