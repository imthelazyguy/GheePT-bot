// events/interactionCreate.js
const { Events } = require('discord.js');
// ... (all other require statements at the top)

async function handleCommand(interaction, db) {
    console.log(`[DEBUG] handleCommand started for /${interaction.commandName}.`);
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) {
        console.error(`[DEBUG] No command matching ${interaction.commandName} was found.`);
        return;
    }
    try {
        console.log(`[DEBUG] Executing command: /${interaction.commandName}.`);
        await command.execute(interaction, db);
        console.log(`[DEBUG] Finished command: /${interaction.commandName}.`);
    } catch (error) {
        console.error(`[DEBUG] Error executing command ${interaction.commandName}:`, error);
        // ... (rest of error handling)
    }
}

// ... (All your other handleButton, handleModal, etc. functions)

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, db) {
        console.log(`[DEBUG] Interaction received. User: ${interaction.user.username}, Type: ${interaction.type}, ID: ${interaction.isCommand() ? interaction.commandName : interaction.customId}`);
        // ... (the rest of the routing logic)
    },
};
