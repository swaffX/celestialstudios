const { Events } = require('discord.js');
const Guild = require('../models/Guild');
const User = require('../models/User');
const config = require('../config');
const embedBuilder = require('../utils/embedBuilder');
const achievementChecker = require('../utils/achievementChecker');
const logger = require('../utils/logger');

// Import invite cache
const inviteCreateEvent = require('./inviteCreate');

module.exports = {
    name: Events.GuildMemberAdd,
    once: false,

    async execute(member, client) {
        try {
            const guildSettings = await Guild.findOrCreate(member.guild.id);

            // === INVITE TRACKING ===
            await this.trackInvite(member, client, guildSettings);

            // Check if welcome feature is enabled
            if (!guildSettings.features.welcome) return;

            // Send welcome message
            if (guildSettings.welcomeChannel) {
                try {
                    const channel = await client.channels.fetch(guildSettings.welcomeChannel);
                    if (channel) {
                        const embed = embedBuilder.welcome(member, guildSettings);
                        await channel.send({
                            content: `${member}`,
                            embeds: [embed]
                        });
                    }
                } catch (error) {
                    logger.error('Failed to send welcome message:', error);
                }
            }

            // Assign auto roles
            if (guildSettings.autoRoles && guildSettings.autoRoles.length > 0) {
                for (const roleId of guildSettings.autoRoles) {
                    try {
                        const role = member.guild.roles.cache.get(roleId);
                        if (role) {
                            await member.roles.add(role);
                            logger.info(`Assigned auto role ${role.name} to ${member.user.tag}`);
                        }
                    } catch (error) {
                        logger.error(`Failed to assign auto role ${roleId}:`, error);
                    }
                }
            }

            logger.info(`${member.user.tag} joined ${member.guild.name}`);

        } catch (error) {
            logger.error('Error in guildMemberAdd event:', error);
        }
    },

    async trackInvite(member, client, guildSettings) {
        try {
            // Get cached invites
            const cachedInvites = inviteCreateEvent.getCache().get(member.guild.id) || new Map();

            // Fetch current invites
            const newInvites = await member.guild.invites.fetch();

            // Find the invite that was used
            let usedInvite = null;

            newInvites.forEach(invite => {
                const cachedUses = cachedInvites.get(invite.code) || 0;
                if (invite.uses > cachedUses) {
                    usedInvite = invite;
                }
            });

            // Update cache
            await inviteCreateEvent.updateCache(member.guild);

            if (!usedInvite || !usedInvite.inviter) return;

            // Check account age
            const accountAge = Math.floor((Date.now() - member.user.createdAt) / (1000 * 60 * 60 * 24));
            if (accountAge < config.invites.minAccountAge) {
                logger.info(`Invite from ${usedInvite.inviter.tag} not counted - account too new`);
                return;
            }

            // Get or create inviter's data
            const inviterData = await User.findOrCreate(usedInvite.inviter.id, member.guild.id);

            // Increment invites
            inviterData.invites++;

            // Add XP reward
            inviterData.totalXp += config.invites.xpPerInvite;
            inviterData.xp += config.invites.xpPerInvite;

            await inviterData.save();

            // Save who invited the new member
            const newMemberData = await User.findOrCreate(member.id, member.guild.id);
            newMemberData.invitedBy = usedInvite.inviter.id;
            newMemberData.inviteCode = usedInvite.code;
            await newMemberData.save();

            // Check achievements for inviter
            try {
                const inviterMember = await member.guild.members.fetch(usedInvite.inviter.id);
                const unlockedAchievements = await achievementChecker.check(inviterData, client, inviterMember);

                // Notify about unlocked achievements
                for (const achievement of unlockedAchievements) {
                    if (guildSettings.levelChannel) {
                        try {
                            const channel = await client.channels.fetch(guildSettings.levelChannel);
                            if (channel) {
                                const embed = embedBuilder.achievement(inviterMember.user, achievement);
                                await channel.send({ embeds: [embed] });
                            }
                        } catch (error) {
                            logger.error('Failed to send achievement notification:', error);
                        }
                    }
                }
            } catch (error) {
                // Inviter might have left
            }

            logger.info(`${member.user.tag} was invited by ${usedInvite.inviter.tag} (Total: ${inviterData.invites})`);

        } catch (error) {
            logger.error('Error tracking invite:', error);
        }
    }
};
