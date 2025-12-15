const { ChannelType, PermissionFlagsBits } = require('discord.js');
const Guild = require('../models/Guild');
const logger = require('../utils/logger');

// Stats channel configurations
const STATS_CONFIG = {
    categoryName: '📊 SERVER STATS',
    channels: [
        { key: 'allMembers', prefix: '👥 All Members: ' },
        { key: 'members', prefix: '👤 Members: ' },
        { key: 'bots', prefix: '🤖 Bots: ' }
    ]
};

/**
 * Get server statistics
 */
function getServerStats(guild) {
    const allMembers = guild.memberCount;
    const bots = guild.members.cache.filter(m => m.user.bot).size;
    const members = allMembers - bots;

    return {
        allMembers,
        members,
        bots
    };
}

/**
 * Update stats channels
 */
async function updateStatsChannels(guild, channelIds) {
    try {
        const stats = getServerStats(guild);

        // Update each channel
        for (const config of STATS_CONFIG.channels) {
            const channelId = channelIds[config.key];
            if (!channelId) continue;

            const channel = guild.channels.cache.get(channelId);
            if (!channel) continue;

            const newName = `${config.prefix}${stats[config.key]}`;

            // Only update if name changed
            if (channel.name !== newName) {
                await channel.setName(newName).catch(err => logger.error('Failed to update stats channel:', err));
            }
        }

        logger.info(`📊 Stats updated for ${guild.name}: All: ${stats.allMembers}, Members: ${stats.members}, Bots: ${stats.bots}`);
    } catch (error) {
        logger.error('Stats update error:', error);
    }
}

/**
 * Create stats channels
 */
async function createStatsChannels(guild) {
    try {
        // Create category first
        const category = await guild.channels.create({
            name: STATS_CONFIG.categoryName,
            type: ChannelType.GuildCategory,
            position: 0,
            permissionOverwrites: [
                {
                    id: guild.roles.everyone.id,
                    deny: [PermissionFlagsBits.Connect],
                    allow: [PermissionFlagsBits.ViewChannel]
                }
            ]
        });

        const stats = getServerStats(guild);
        const channelIds = { categoryId: category.id };

        // Create each stats channel
        for (const config of STATS_CONFIG.channels) {
            const channel = await guild.channels.create({
                name: `${config.prefix}${stats[config.key]}`,
                type: ChannelType.GuildVoice,
                parent: category.id,
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone.id,
                        deny: [PermissionFlagsBits.Connect],
                        allow: [PermissionFlagsBits.ViewChannel]
                    }
                ]
            });

            channelIds[config.key] = channel.id;
        }

        // Save to database
        await Guild.findOneAndUpdate(
            { guildId: guild.id },
            {
                'serverStats.enabled': true,
                'serverStats.channelIds': channelIds
            },
            { upsert: true }
        );

        logger.info(`📊 Stats channels created for ${guild.name}`);

        return {
            success: true,
            categoryId: category.id,
            channelIds
        };
    } catch (error) {
        logger.error('Stats channels creation error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Delete stats channels
 */
async function deleteStatsChannels(guild, channelIds) {
    try {
        // Delete channels
        for (const key of ['allMembers', 'members', 'bots']) {
            if (channelIds[key]) {
                const channel = guild.channels.cache.get(channelIds[key]);
                if (channel) await channel.delete().catch(() => { });
            }
        }

        // Delete category
        if (channelIds.categoryId) {
            const category = guild.channels.cache.get(channelIds.categoryId);
            if (category) await category.delete().catch(() => { });
        }

        // Update database
        await Guild.findOneAndUpdate(
            { guildId: guild.id },
            {
                'serverStats.enabled': false,
                'serverStats.channelIds': null
            }
        );

        logger.info(`📊 Stats channels deleted for ${guild.name}`);
        return true;
    } catch (error) {
        logger.error('Stats channels deletion error:', error);
        return false;
    }
}

/**
 * Initialize server stats system
 */
async function initServerStats(client, updateInterval = 300000) {
    logger.info('📊 Server Stats system initialized');

    // Periodic update (every 5 minutes by default)
    setInterval(async () => {
        try {
            const guilds = await Guild.find({ 'serverStats.enabled': true });

            for (const guildData of guilds) {
                const guild = client.guilds.cache.get(guildData.guildId);
                if (guild && guildData.serverStats?.channelIds) {
                    await guild.members.fetch().catch(() => { });
                    await updateStatsChannels(guild, guildData.serverStats.channelIds);
                }
            }
        } catch (error) {
            logger.error('Server stats periodic update error:', error);
        }
    }, updateInterval);
}

/**
 * Trigger stats update on member join/leave
 */
async function triggerStatsUpdate(guild) {
    try {
        const guildData = await Guild.findOne({ guildId: guild.id });
        if (guildData?.serverStats?.enabled && guildData.serverStats.channelIds) {
            setTimeout(() => updateStatsChannels(guild, guildData.serverStats.channelIds), 5000);
        }
    } catch (error) {
        logger.error('Trigger stats update error:', error);
    }
}

/**
 * Force update stats
 */
async function forceUpdateStats(guild) {
    try {
        const guildData = await Guild.findOne({ guildId: guild.id });
        if (guildData?.serverStats?.enabled && guildData.serverStats.channelIds) {
            await guild.members.fetch().catch(() => { });
            await updateStatsChannels(guild, guildData.serverStats.channelIds);
            return true;
        }
        return false;
    } catch (error) {
        logger.error('Force update stats error:', error);
        return false;
    }
}

module.exports = {
    initServerStats,
    createStatsChannels,
    deleteStatsChannels,
    updateStatsChannels,
    forceUpdateStats,
    triggerStatsUpdate,
    getServerStats,
    STATS_CONFIG
};
