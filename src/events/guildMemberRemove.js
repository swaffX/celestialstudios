const { Events } = require('discord.js');
const Guild = require('../models/Guild');
const User = require('../models/User');
const config = require('../config');
const embedBuilder = require('../utils/embedBuilder');
const logger = require('../utils/logger');

module.exports = {
    name: Events.GuildMemberRemove,
    once: false,

    async execute(member, client) {
        try {
            const guildSettings = await Guild.findOrCreate(member.guild.id);

            // === FAKE INVITE PENALTY ===
            if (config.invites.fakeInvitePenalty) {
                await this.handleFakeInvite(member);
            }

            // Check if farewell feature is enabled
            if (!guildSettings.features.farewell) return;

            // Send farewell message
            if (guildSettings.farewellChannel) {
                try {
                    const channel = await client.channels.fetch(guildSettings.farewellChannel);
                    if (channel) {
                        const embed = embedBuilder.farewell(member, guildSettings);
                        await channel.send({ embeds: [embed] });
                    }
                } catch (error) {
                    logger.error('Failed to send farewell message:', error);
                }
            }

            logger.info(`${member.user.tag} left ${member.guild.name}`);

        } catch (error) {
            logger.error('Error in guildMemberRemove event:', error);
        }
    },

    async handleFakeInvite(member) {
        try {
            // Find who invited this member
            const leavingUser = await User.findOne({
                odasi: member.id,
                odaId: member.guild.id
            });

            if (!leavingUser || !leavingUser.invitedBy) return;

            // Get inviter's data and decrement invite
            const inviterData = await User.findOne({
                odasi: leavingUser.invitedBy,
                odaId: member.guild.id
            });

            if (!inviterData) return;

            // Decrement invite count and add fake invite
            if (inviterData.invites > 0) {
                inviterData.invites--;
                inviterData.fakeInvites++;
                await inviterData.save();

                logger.info(`Fake invite recorded: ${member.user.tag} left (invited by ${leavingUser.invitedBy})`);
            }

        } catch (error) {
            logger.error('Error handling fake invite:', error);
        }
    }
};
