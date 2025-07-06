// utils/imageGenerator.js
const fetch = require('node-fetch');

async function createCardWithAPI(config) {
    const url = 'https://quickchart.io/chart/create';
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chart: config,
                backgroundColor: '#2C2F33',
                width: 500,
                height: 150,
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

async function createAttributeCard(title, barLabel, percentage) {
    const chartConfig = {
        type: 'progressBar',
        data: {
            datasets: [{ data: [percentage], backgroundColor: '#FFD700', borderRadius: 5 }]
        },
        options: {
            plugins: {
                datalabels: { display: false },
                chartJsPluginAnnotation: {
                    annotations: [{
                        type: 'label',
                        content: title,
                        font: { size: 28, family: 'sans-serif', weight: 'bold' },
                        color: '#FFFFFF',
                        position: { x: '50%', y: '40px' },
                    }, {
                        type: 'label',
                        content: barLabel,
                        font: { size: 20, family: 'sans-serif' },
                        color: '#B9BBBE',
                        position: { x: '50%', y: '110px' },
                    }]
                }
            },
            layout: { padding: { top: 20 } }
        }
    };
    return await createCardWithAPI(chartConfig);
}

async function createShipCard(percentage) {
    const chartConfig = {
        type: 'radialGauge',
        data: { datasets: [{ data: [percentage], backgroundColor: '#FF4560' }] },
        options: {
            trackColor: '#444',
            centerPercentage: true,
            centerArea: { text: (val) => `${val}%`, fontColor: 'white', fontSize: 40 },
        }
    };
    return await createCardWithAPI(chartConfig);
}

module.exports = { createAttributeCard, createShipCard };
