const { Events } = require('discord.js');
const logger = require('../utils/logger');
const { handleNewBoost } = require('../systems/boosterSystem');

module.exports = {
    name: Events.GuildMemberUpdate,
    once: false,

    async execute(oldMember, newMember, client) {
        try {
            // Detect new boost
            if (!oldMember.premiumSince && newMember.premiumSince) {
                logger.info(`🚀 ${newMember.user.tag} boosted ${newMember.guild.name}`);
                await handleNewBoost(newMember, client);
            }

            // Detect boost removed (could be used for handling unboosts)
            if (oldMember.premiumSince && !newMember.premiumSince) {
                logger.info(`💔 ${newMember.user.tag} removed boost from ${newMember.guild.name}`);
                // Could trigger updateBoosterEmbed here if needed
            }

        } catch (error) {
            logger.error('Error in guildMemberUpdate event:', error);
        }
    }
};
