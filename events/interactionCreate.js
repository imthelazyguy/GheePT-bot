// events/interactionCreate.js
const { Events } = require('discord.js');

async function handleCommand(interaction, db) {
    console.log(`[DEBUG] ROUTER: handleCommand started for /${interaction.commandName}.`);
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) {
        console.error(`[DEBUG] ROUTER: No command matching ${interaction.commandName} was found.`);
        return;
    }
    try {
        console.log(`[DEBUG] ROUTER: Executing command: /${interaction.commandName}.`);
        await command.execute(interaction, db);
        console.log(`[DEBUG] ROUTER: Finished command: /${interaction.commandName}.`);
    } catch (error) {
        console.error(`[DEBUG] ROUTER: Error executing /${interaction.commandName}:`, error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was a critical error executing this command!', ephemeral: true }).catch(e => console.error("Follow-up error reply failed:", e));
        } else {
            await interaction.reply({ content: 'There was a critical error executing this command!', ephemeral: true }).catch(e => console.error("Initial error reply failed:", e));
        }
    }
}

// ... All other handler functions (for buttons, modals, etc.) should be here ...

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, db) {
        // We only care about commands for this test
        if (interaction.isChatInputCommand()) {
            const id = interaction.commandName;
            console.log(`[DEBUG] ROUTER: Interaction received. User: ${interaction.user.username}, Type: Command, ID: ${id}`);
            await handleCommand(interaction, db);
        }
    },
};
