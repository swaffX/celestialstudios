const { Events } = require('discord.js');
const User = require('../models/User');
const config = require('../config');
const achievementChecker = require('../utils/achievementChecker');
const logger = require('../utils/logger');

module.exports = {
    name: Events.VoiceStateUpdate,
    once: false,

    async execute(oldState, newState, client) {
        const odasi = newState.member?.id || oldState.member?.id;
        const guildId = newState.guild?.id || oldState.guild?.id;

        if (!odasi || !guildId) return;

        try {
            // User joined a voice channel
            if (!oldState.channelId && newState.channelId) {
                // Start tracking voice time
                client.voiceStates.set(`${odasi}-${guildId}`, Date.now());
                logger.debug(`${newState.member.user.tag} joined voice channel`);
            }

            // User left a voice channel
            if (oldState.channelId && !newState.channelId) {
                const joinTime = client.voiceStates.get(`${odasi}-${guildId}`);

                if (joinTime) {
                    const duration = Date.now() - joinTime;
                    const minutes = Math.floor(duration / 60000);

                    if (minutes > 0) {
                        // Apply hourly limit
                        const cappedMinutes = Math.min(minutes, config.leveling.voiceMaxMinutesPerHour);

                        // Get or create user
                        let userData = await User.findOne({ odasi, odaId: guildId });
                        if (!userData) {
                            userData = await User.create({ odasi, odaId: guildId });
                        }

                        // Add voice time
                        userData.voiceTime += cappedMinutes;

                        // Calculate voice XP
                        const voiceXP = cappedMinutes * config.leveling.voiceXpPerMinute;

                        // Add XP
                        const result = await userData.addXp(voiceXP, config);
                        await userData.save();

                        // Check achievements
                        const member = oldState.member || newState.member;
                        if (member) {
                            await achievementChecker.check(userData, client, member);
                        }

                        logger.debug(`${oldState.member?.user.tag} left voice. Time: ${minutes}min, XP: ${voiceXP}`);
                    }

                    // Clean up tracking
                    client.voiceStates.delete(`${odasi}-${guildId}`);
                }
            }

            // User switched channels
            if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
                logger.debug(`${newState.member.user.tag} switched voice channels`);
            }

            // User muted/unmuted, deafened, etc. - no action needed

        } catch (error) {
            logger.error('Error in voiceStateUpdate event:', error);
        }

        // === VOICE LOGGING ===
        try {
            const guildSettings = await require('../models/Guild').findOne({ guildId: guildId });
            if (!guildSettings?.logs?.enabled || !guildSettings.logs.channels.voice) return;

            const logChannel = newState.guild.channels.cache.get(guildSettings.logs.channels.voice);
            if (!logChannel) return;

            const EmbedBuilder = require('discord.js').EmbedBuilder;
            const member = newState.member;

            // Use member.user.tag for consistency
            const userTag = member.user.tag;
            const avatar = member.user.displayAvatarURL();

            // Joined
            if (!oldState.channelId && newState.channelId) {
                const embed = new EmbedBuilder()
                    .setColor('#2ecc71')
                    .setAuthor({ name: userTag, iconURL: avatar })
                    .setDescription(`📥 **Joined voice channel** <#${newState.channelId}>`)
                    .setFooter({ text: `User ID: ${member.id}` })
                    .setTimestamp();
                await logChannel.send({ embeds: [embed] });
            }

            // Left
            else if (oldState.channelId && !newState.channelId) {
                const embed = new EmbedBuilder()
                    .setColor('#e74c3c')
                    .setAuthor({ name: userTag, iconURL: avatar })
                    .setDescription(`📤 **Left voice channel** <#${oldState.channelId}>`)
                    .setFooter({ text: `User ID: ${member.id}` })
                    .setTimestamp();
                await logChannel.send({ embeds: [embed] });
            }

            // Switched
            else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
                const embed = new EmbedBuilder()
                    .setColor('#f1c40f')
                    .setAuthor({ name: userTag, iconURL: avatar })
                    .setDescription(`🔄 **Switched voice channel**\nFrom: <#${oldState.channelId}>\nTo: <#${newState.channelId}>`)
                    .setFooter({ text: `User ID: ${member.id}` })
                    .setTimestamp();
                await logChannel.send({ embeds: [embed] });
            }

        } catch (error) {
            logger.error('Error logging voice state:', error);
        }
    }
};
