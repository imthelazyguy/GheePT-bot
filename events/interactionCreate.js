// events/interactionCreate.js
const { Events } = require('discord.js');
const handlers = require('./interactionHandlers');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, db) {
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;
            try {
                // Special case for starting roulette
                if (interaction.commandName === 'roulette') {
                    await handlers.startRouletteGame(interaction);
                } else {
                    await command.execute(interaction, db);
                }
            } catch (error) {
                console.error(`Error executing command ${interaction.commandName}:`, error);
                // Your error handling logic
            }
        } else if (interaction.isButton()) {
            const [gameType, channelId, timestamp, action] = interaction.customId.split('_');
            if (gameType === 'roulette') {
                // You would have a function like handleRouletteButton in interactionHandlers.js
                // await handlers.handleRouletteButton(interaction);
            }
            // ... other button routing
        } else if (interaction.isModalSubmit()) {
            // ... modal routing
        }
    },
};
