const { Events } = require('discord.js');
const User = require('../models/User');
const config = require('../config');
const achievementChecker = require('../utils/achievementChecker');
const embedBuilder = require('../utils/embedBuilder');
const logger = require('../utils/logger');

// Store invite counts before member joins
const inviteCache = new Map();

module.exports = {
    name: Events.InviteCreate,
    once: false,

    async execute(invite, client) {
        // Cache invite when created
        const guildInvites = inviteCache.get(invite.guild.id) || new Map();
        guildInvites.set(invite.code, invite.uses);
        inviteCache.set(invite.guild.id, guildInvites);
    }
};

// Export cache update function
module.exports.updateCache = async (guild) => {
    try {
        const invites = await guild.invites.fetch();
        const guildInvites = new Map();
        invites.forEach(invite => {
            guildInvites.set(invite.code, invite.uses);
        });
        inviteCache.set(guild.id, guildInvites);
        return guildInvites;
    } catch (error) {
        logger.error('Failed to update invite cache:', error);
        return new Map();
    }
};

module.exports.getCache = () => inviteCache;
