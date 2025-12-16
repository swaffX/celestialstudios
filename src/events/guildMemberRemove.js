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
                            // Premium Farewell Embed
                            const memberCount = member.guild.memberCount;

                            const embed = new EmbedBuilder()
                                .setColor('#ED4245') // Discord red
                                .setAuthor({
                                    name: 'Member Left',
                                    iconURL: member.guild.iconURL({ dynamic: true })
                                })
                                .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 512 }))
                                .setDescription(
                                    `## 👋 Goodbye, ${member.user.username}!\n\n` +
                                    `> We're sad to see you go.\n` +
                                    `> Hope to see you again soon!\n\n` +
                                    `╭───────────────────────────╮`
                                )
                                .addFields(
                                    {
                                        name: '👤 Member',
                                        value: `\`${member.user.tag}\``,
                                        inline: true
                                    },
                                    {
                                        name: '📊 Members Now',
                                        value: `\`${memberCount}\``,
                                        inline: true
                                    }
                                )
                                .setImage('https://cdn.discordapp.com/attachments/531892263652032522/1450318352022114535/Gemini_Generated_Image_pkcjdjpkcjdjpkcj.png')
                                .setFooter({ text: `We now have ${memberCount} members`, iconURL: member.user.displayAvatarURL() })
                                .setTimestamp();

                            await channel.send({ embeds: [embed] });
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
