// events/interactionCreate.js
const { Events } = require('discord.js');

async function handleCommand(interaction, db) {
    console.log(`[DIAGNOSTIC] ROUTER: handleCommand started for /${interaction.commandName}.`);
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) {
        console.error(`[DIAGNOSTIC] ROUTER: No command matching ${interaction.commandName} was found.`);
        return;
    }
    try {
        await command.execute(interaction, db);
        console.log(`[DIAGNOSTIC] ROUTER: Finished command: /${interaction.commandName}.`);
    } catch (error) {
        console.error(`[DIAGNOSTIC] ROUTER: Error executing /${interaction.commandName}:`, error);
    }
}

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, db) {
        if (interaction.isChatInputCommand()) {
            console.log(`[DIAGNOSTIC] ROUTER: Interaction received. User: ${interaction.user.username}, Command: /${interaction.commandName}`);
            await handleCommand(interaction, db);
        }
    },
};
