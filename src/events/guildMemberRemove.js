const { Events, EmbedBuilder } = require('discord.js');
const Guild = require('../models/Guild');
const User = require('../models/User');
const logger = require('../utils/logger');
const { triggerStatsUpdate } = require('../systems/serverStatsSystem');

module.exports = {
    name: Events.GuildMemberRemove,
    once: false,

    async execute(member, client) {
        try {
            const guildSettings = await Guild.findOrCreate(member.guild.id);

            // === SERVER STATS UPDATE ===
            triggerStatsUpdate(member.guild);

            // === FAREWELL SYSTEM ===
            if (guildSettings.welcomeSystem?.enabled || guildSettings.features?.farewell) {

                const channelId = guildSettings.welcomeSystem?.farewellChannelId || guildSettings.farewellChannel;

                if (channelId) {
                    try {
                        const channel = await member.guild.channels.fetch(channelId);
                        if (channel) {
                            const messageTemplate = guildSettings.welcomeSystem?.farewellMessage ||
                                guildSettings.farewellMessage ||
                                'Goodbye **{username}**! We hope to see you again! 👋';

                            const message = messageTemplate
                                .replace(/{username}/g, member.user.username)
                                .replace(/{user}/g, member.user.tag)
                                .replace(/{server}/g, member.guild.name)
                                .replace(/{count}/g, member.guild.memberCount);

                            await channel.send({ content: message });
                        }
                    } catch (error) {
                        logger.error('Failed to send farewell message:', error);
                    }
                }
            }

            // === FAKE INVITE CHECK & PENALTY ===
            // Check if user was invited by someone
            const leavingUserData = await User.findOne({ odasi: member.id, odaId: member.guild.id });

            if (leavingUserData && leavingUserData.invitedBy) {
                const inviterId = leavingUserData.invitedBy;
                const inviterData = await User.findOne({ odasi: inviterId, odaId: member.guild.id });

                if (inviterData) {
                    // Update stats
                    inviterData.invites.left++;
                    // Optional: You could decrement regular if you want 'regular' to ONLY represent 'current' members
                    // But usually keeping 'regular' as 'total valid joins' and 'left' as 'leaves' allows better analytics.
                    // We'll calculate NET invites when displaying.

                    await inviterData.save();

                    logger.info(`Member left: ${member.user.tag} (invited by ${inviterId})`);
                }
            }

        } catch (error) {
            logger.error('GuildMemberRemove error:', error);
        }
    }
};
