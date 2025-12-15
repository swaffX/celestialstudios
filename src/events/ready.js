const { Events, ActivityType } = require('discord.js');
const logger = require('../utils/logger');

module.exports = {
    name: Events.ClientReady,
    once: true,

    async execute(client) {
        logger.success(`Bot logged in as ${client.user.tag}`);
        logger.info(`Serving ${client.guilds.cache.size} guild(s)`);
        logger.info(`Total members: ${client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0)}`);

        // Set bot activity
        client.user.setPresence({
            activities: [{
                name: 'Celestial Studios',
                type: ActivityType.Watching
            }],
            status: 'online'
        });

        // Start giveaway handler
        client.giveawayHandler.start();

        // Log guild names
        client.guilds.cache.forEach(guild => {
            logger.info(`Connected to: ${guild.name} (${guild.id})`);
        });
    }
};
