const { Events } = require('discord.js');
const User = require('../models/User');
const Guild = require('../models/Guild');
const config = require('../config');
const levelCalculator = require('../utils/levelCalculator');
const achievementChecker = require('../utils/achievementChecker');
const embedBuilder = require('../utils/embedBuilder');
const logger = require('../utils/logger');

module.exports = {
    name: Events.MessageCreate,
    once: false,

    async execute(message, client) {
        // Ignore bots and DMs
        if (message.author.bot || !message.guild) return;

        try {
            // Get guild settings
            const guildSettings = await Guild.findOrCreate(message.guild.id);

            // Check if leveling is enabled
            if (!guildSettings.levelSystem?.enabled && !guildSettings.features?.leveling) return;

            // First check RAW data to see if migration is needed (bypass Mongoose casting)
            const rawUser = await User.findOne({ odasi: message.author.id, odaId: message.guild.id }).lean();

            if (rawUser && (typeof rawUser.invites === 'number' || rawUser.invites === undefined)) {

                const oldInvites = typeof rawUser.invites === 'number' ? rawUser.invites : 0;

                // 1. Unset the old field
                await User.updateOne(
                    { _id: rawUser._id },
                    { $unset: { invites: 1 } }
                );

                // 2. Set the new object structure
                await User.updateOne(
                    { _id: rawUser._id },
                    {
                        $set: {
                            invites: {
                                regular: oldInvites,
                                bonus: 0,
                                fake: 0,
                                left: 0,
                                total: oldInvites
                            }
                        }
                    }
                );
            }

            // Get or create user (it will now be clean)
            let userData = await User.findOrCreate(message.author.id, message.guild.id);

            // Increment message count
            userData.totalMessages++;
            userData.lastSeen = new Date();

            // Check XP cooldown
            if (!levelCalculator.canEarnXP(userData.lastMessageTime)) {
                await userData.save();
                return;
            }

            // Calculate random XP
            const xpAmount = levelCalculator.getRandomXP();

            // Add XP with daily limit check
            const result = await userData.addXp(xpAmount, config);

            // Update last message time
            userData.lastMessageTime = new Date();
            await userData.save();

            // Check level up
            if (result.leveledUp) {
                // Send level up notification with retry
                if (guildSettings.levelChannel) {
                    let retries = 3;
                    while (retries > 0) {
                        try {
                            const channel = await client.channels.fetch(guildSettings.levelChannel);
                            if (channel) {
                                const embed = embedBuilder.levelUp(message.author, result.newLevel);
                                await channel.send({
                                    content: `${message.author}`,
                                    embeds: [embed]
                                });
                                break; // Success, exit loop
                            }
                        } catch (error) {
                            retries--;
                            if (retries === 0) {
                                logger.error('Failed to send level up notification after retries:', error);
                            } else {
                                await new Promise(res => setTimeout(res, 2000)); // Wait 2s before retry
                            }
                        }
                    }
                }

                // Check for level roles
                const levelRole = guildSettings.getLevelRole(result.newLevel);
                if (levelRole) {
                    try {
                        const role = message.guild.roles.cache.get(levelRole.roleId);
                        if (role && !message.member.roles.cache.has(role.id)) {
                            await message.member.roles.add(role);
                            logger.info(`Assigned level role ${role.name} to ${message.author.tag}`);
                        }
                    } catch (error) {
                        logger.error('Failed to assign level role:', error);
                    }
                }

                logger.info(`${message.author.tag} leveled up to ${result.newLevel}`);
            }

            // Check achievements
            const unlockedAchievements = await achievementChecker.check(userData, client, message.member);

            // Notify about unlocked achievements
            for (const achievement of unlockedAchievements) {
                if (guildSettings.levelChannel) {
                    try {
                        const channel = await client.channels.fetch(guildSettings.levelChannel);
                        if (channel) {
                            const embed = embedBuilder.achievement(message.author, achievement);
                            await channel.send({ embeds: [embed] });
                        }
                    } catch (error) {
                        logger.error('Failed to send achievement notification:', error);
                    }
                }
            }

        } catch (error) {
            logger.error('Error in messageCreate event:', error);
        }
    }
};
