// events/voiceStateUpdate.js
const { Events } = require('discord.js');

module.exports = {
    name: Events.VoiceStateUpdate,
    execute(oldState, newState, db) {
        const user = newState.member.user;
        if (user.bot) return;

        const voiceUsers = newState.client.voiceUsers;
        
        // User joins a voice channel or moves from another
        if (newState.channelId && oldState.channelId !== newState.channelId) {
            voiceUsers.set(user.id, {
                guildId: newState.guild.id,
                joinTime: Date.now()
            });
            console.log(`${user.tag} joined voice in ${newState.guild.name}.`);
        } 
        // User leaves a voice channel
        else if (!newState.channelId && oldState.channelId) {
            voiceUsers.delete(user.id);
            console.log(`${user.tag} left voice in ${oldState.guild.name}.`);
        }
    },
};