// events/interactionCreate.js
const { Events } = require('discord.js');
// ... (All other require statements)

async function handleCommand(interaction, db) {
    if (process.env.DEBUG_MODE === 'true') console.log(`[DEBUG] handleCommand started for /${interaction.commandName}.`);
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) {
        console.error(`[DEBUG] No command matching ${interaction.commandName} was found.`);
        return;
    }
    try {
        if (process.env.DEBUG_MODE === 'true') console.log(`[DEBUG] Executing command: /${interaction.commandName}.`);
        await command.execute(interaction, db);
        if (process.env.DEBUG_MODE === 'true') console.log(`[DEBUG] Finished command: /${interaction.commandName}.`);
    } catch (error) {
        console.error(`[DEBUG] Error executing command ${interaction.commandName}:`, error);
        // ... (error handling)
    }
}

// ... (All your other handler functions like handleRouletteButton, etc.)

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, db) {
        if (process.env.DEBUG_MODE === 'true') {
            const id = interaction.isCommand() ? interaction.commandName : interaction.customId;
            console.log(`[DEBUG] Interaction received. User: ${interaction.user.username}, Type: ${interaction.type}, ID: ${id}`);
        }
        // ... (The rest of your routing logic: isChatInputCommand, isButton, etc.)
    },
};
