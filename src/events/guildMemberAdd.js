const { Events, EmbedBuilder } = require('discord.js');
const Guild = require('../models/Guild');
const User = require('../models/User');
const logger = require('../utils/logger');
const { triggerStatsUpdate } = require('../systems/serverStatsSystem');

// Import invite cache
const inviteCreateEvent = require('./inviteCreate');

module.exports = {
    name: Events.GuildMemberAdd,
    once: false,

    async execute(member, client) {
        try {
            const guildSettings = await Guild.findOrCreate(member.guild.id);

            // === INVITE TRACKING ===
            const inviteData = await this.trackInvite(member, client, guildSettings);

            // === SERVER STATS UPDATE ===
            triggerStatsUpdate(member.guild);

            // === WELCOME SYSTEM ===
            // Check if welcome system is enabled (new schema) or legacy feature is enabled
            if (guildSettings.welcomeSystem?.enabled || guildSettings.features?.welcome) {

                // Get channel ID from new or old schema
                const channelId = guildSettings.welcomeSystem?.welcomeChannelId || guildSettings.welcomeChannel;

                if (channelId) {
                    try {
                        const channel = await member.guild.channels.fetch(channelId);
                        if (channel) {
                            // Premium Welcome Embed
                            const memberCount = member.guild.memberCount;
                            const createdAt = Math.floor(member.user.createdTimestamp / 1000);

                            const embed = new EmbedBuilder()
                                .setColor('#43B581') // Discord green
                                .setAuthor({
                                    name: `Welcome to ${member.guild.name}!`,
                                    iconURL: member.guild.iconURL({ dynamic: true })
                                })
                                .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 512 }))
                                .setDescription(
                                    `## 👋 Hey ${member}!\n\n` +
                                    `> Thanks for joining our community.\n` +
                                    `> Make sure to read the rules and enjoy your stay!\n\n` +
                                    `╭───────────────────────────╮`
                                )
                                .addFields(
                                    {
                                        name: '👤 Member',
                                        value: `\`${member.user.username}\``,
                                        inline: true
                                    },
                                    {
                                        name: '🎂 Account Created',
                                        value: `<t:${createdAt}:R>`,
                                        inline: true
                                    },
                                    {
                                        name: '📊 Member Count',
                                        value: `\`#${memberCount}\``,
                                        inline: true
                                    }
                                )
                                .setImage(guildSettings.welcomeSystem?.bannerUrl || 'https://cdn.discordapp.com/attachments/531892263652032522/1450318087948603486/Gemini_Generated_Image_mhflenmhflenmhfl.png')
                                .setFooter({ text: `Member #${memberCount} • Joined the server`, iconURL: member.user.displayAvatarURL() })
                                .setTimestamp();

                            await channel.send({ content: `${member}`, embeds: [embed] });
                        }
                    } catch (error) {
                        logger.error('Failed to send welcome message:', error);
                    }
                }
            }

            // === INVITE NOTIFICATIONS ===
            // Send to dedicated invites channel if configured
            if (guildSettings.welcomeSystem?.invitesChannelId) {
                try {
                    const invitesChannel = await member.guild.channels.fetch(guildSettings.welcomeSystem.invitesChannelId);
                    if (invitesChannel) {
                        const inviter = inviteData.inviter;
                        const isFake = inviteData.isNewMemberFake;

                        const embed = new EmbedBuilder()
                            .setColor(isFake ? '#e74c3c' : '#9b59b6')
                            .setAuthor({ name: 'New Member Joined', iconURL: member.user.displayAvatarURL({ dynamic: true }) })
                            .setDescription(
                                `**${member.user.tag}** joined the server!\n` +
                                `> Invited by: ${inviter ? `${inviter} (\`${inviter.tag}\`)` : 'Unknown / Vanity / Bot'}\n` +
                                `> Invites: **${inviteData.inviterCount || 0}**\n` +
                                `${isFake ? '⚠️ **Flagged as Fake Attempt** (Account < 7 days)' : ''}`
                            )
                            .setFooter({ text: `Member #${member.guild.memberCount}` })
                            .setTimestamp();

                        await invitesChannel.send({ embeds: [embed] });
                    }
                } catch (error) {
                    logger.error('Failed to send invite notification:', error);
                }
            }

            // === AUTO ROLES ===
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

        } catch (error) {
            logger.error('GuildMemberAdd error:', error);
        }
    },

    async trackInvite(member, client, guildSettings) {
        let inviter = null;
        let inviterCount = 0;

        try {
            const guildInvites = await member.guild.invites.fetch();
            const cachedInvites = inviteCreateEvent.getInvites(member.guild.id);

            const usedInvite = guildInvites.find(inv => {
                const cached = cachedInvites.get(inv.code);
                return cached && inv.uses > cached;
            });

            if (usedInvite) {
                inviter = usedInvite.inviter;

                // Migrate old invite schema if needed
                if (typeof userData.invites === 'number' || !userData.invites) {
                    const oldInvites = typeof userData.invites === 'number' ? userData.invites : 0;
                    userData.invites = {
                        regular: oldInvites,
                        bonus: 0,
                        fake: 0,
                        left: 0,
                        total: oldInvites
                    };
                }

                const now = Date.now();
                const accountAge = now - member.user.createdTimestamp;
                const isFake = accountAge < (1000 * 60 * 60 * 24 * 7); // 7 days

                if (isFake) {
                    userData.invites.fake++;
                    userData.invites.total++; // Total tracks raw count
                } else {
                    userData.invites.regular++;
                    userData.invites.total++;
                }

                // Track who invited this member
                let newMemberData = await User.findOne({ userId: member.id, guildId: member.guild.id });
                if (!newMemberData) {
                    newMemberData = await User.create({ userId: member.id, guildId: member.guild.id });
                }
                newMemberData.invitedBy = inviter.id;
                await newMemberData.save();

                // Bonus XP for inviter (only for valid invites)
                if (!isFake) {
                    userData.xp += 100;
                }

                await userData.save();

                // Check invite milestones for rewards
                if (guildSettings.inviteRewards?.enabled && guildSettings.inviteRewards.milestones?.length > 0) {
                    const totalInvites = userData.invites.regular + userData.invites.bonus;

                    for (const milestone of guildSettings.inviteRewards.milestones) {
                        if (totalInvites >= milestone.invites) {
                            try {
                                const inviterMember = await member.guild.members.fetch(inviter.id);
                                if (inviterMember && !inviterMember.roles.cache.has(milestone.roleId)) {
                                    await inviterMember.roles.add(milestone.roleId);
                                    logger.info(`Awarded ${milestone.name} to ${inviter.tag} for ${milestone.invites} invites`);

                                    // DM the inviter about their reward
                                    try {
                                        await inviterMember.send(
                                            `🎉 **Congratulations!** You earned the **${milestone.name}** role for reaching **${milestone.invites} invites** in **${member.guild.name}**!`
                                        );
                                    } catch (e) { /* DMs closed */ }
                                }
                            } catch (e) {
                                logger.error('Failed to assign invite reward role:', e);
                            }
                        }
                    }
                }

                inviterCount = (userData.invites.regular + userData.invites.bonus) - userData.invites.left - userData.invites.fake;
            }

            // Update cache
            inviteCreateEvent.setInvites(member.guild.id, guildInvites);

            return { inviter, inviterCount, isNewMemberFake: inviter && (Date.now() - member.user.createdTimestamp < (1000 * 60 * 60 * 24 * 7)) };

        } catch (error) {
            logger.error('Error tracking invite:', error);
        }

        return { inviter, inviterCount };
    }
};
