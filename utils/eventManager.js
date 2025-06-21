// utils/eventManager.js
const { createGheeEmbed } = require('./embeds');
const { Collection } = require('discord.js');
const { FieldValue } = require('firebase-admin/firestore');

async function triggerGheeDrop(guild, db) {
    // ... (rest of the function code remains the same)
    console.log(`Attempting to trigger Ghee Drop for guild: ${guild.id}`);
    const guildConfigRef = db.collection('guilds').doc(guild.id);
    const configDoc = await guildConfigRef.get();

    if (!configDoc.exists) return; // Guild not configured
    const config = configDoc.data();

    const { gheeDropChannelId, gheeDropPingRoleId, gheeDropKeyword, gheeDropDuration } = config;
    if (!gheeDropChannelId || !gheeDropPingRoleId || !gheeDropKeyword || !gheeDropDuration) {
        console.log(`Ghee Drop for guild ${guild.id} is not fully configured.`);
        return;
    }
    
    const lastDrop = config.gheeDropLastTriggered?.toDate();
    if (lastDrop && (new Date() - lastDrop) < 2 * 60 * 60 * 1000) { // 2-hour cooldown
        return;
    }

    const channel = await guild.channels.fetch(gheeDropChannelId).catch(() => null);
    if (!channel) return;

    await guild.members.fetch();
    const randomMember = guild.members.cache.filter(m => !m.user.bot).random();
    if (!randomMember) return;

    await guildConfigRef.update({ gheeDropLastTriggered: new Date() });
    const announcementEmbed = createGheeEmbed('‼️ GHEE DROP INCOMING ‼️', `Attention GheeSpot! Looks like ${randomMember} is dropping some serious ghee! Time to collect, you hungry butter-collectors!\n\nSPAM \`${gheeDropKeyword}\` NOW!`)
        .addFields({ name: 'Time Remaining', value: `${gheeDropDuration} seconds`});

    const message = await channel.send({ content: `<@&${gheeDropPingRoleId}>`, embeds: [announcementEmbed] });

    const collector = channel.createMessageCollector({
        filter: m => m.content.toUpperCase() === gheeDropKeyword.toUpperCase(),
        time: gheeDropDuration * 1000,
    });

    const scores = new Collection();
    collector.on('collect', msg => {
        scores.set(msg.author.id, (scores.get(msg.author.id) || 0) + 1);
    });

    collector.on('end', async collected => {
        if (scores.size === 0) {
            await channel.send({ embeds: [createGheeEmbed('Ghee Drop Over!', 'Wow, no one wanted free stuff? Lame.')] });
            return;
        }
        
        const winners = scores.sort((a, b) => b - a).first(3);
        const winnerIds = winners.map((_score, id) => id);

        const rewards = [1000, 500, 250];
        let description = 'The ghee has been collected! Here are the top collectors:\n\n';
        const batch = db.batch();

        for (let i = 0; i < winnerIds.length; i++) {
            const winnerId = winnerIds[i];
            const score = scores.get(winnerId);
            const reward = rewards[i] || 100;
            description += `**${i + 1}.** <@${winnerId}> - ${score} drops collected! (+${reward} SC)\n`;
            
            const userRef = db.collection('users').doc(`${guild.id}-${winnerId}`);
            batch.set(userRef, { spotCoins: FieldValue.increment(reward) }, { merge: true });
        }

        description += `\n${randomMember}, your ghee has been thoroughly collected. Any words for your diligent collectors?`;

        await batch.commit();

        const resultsEmbed = createGheeEmbed('✨ Ghee Drop Results ✨', description);
        await channel.send({ embeds: [resultsEmbed] });
    });
}

module.exports = { triggerGheeDrop };