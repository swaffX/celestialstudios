const Giveaway = require('../models/Giveaway');
const User = require('../models/User');
const embedBuilder = require('../utils/embedBuilder');
const achievementChecker = require('../utils/achievementChecker');
const logger = require('../utils/logger');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');

class GiveawayHandler {
    constructor(client) {
        this.client = client;
        this.checkInterval = null;
    }

    /**
     * Start the giveaway checker interval
     */
    start() {
        // Check every 10 seconds for ending giveaways
        this.checkInterval = setInterval(() => this.checkGiveaways(), 10000);
        logger.info('Giveaway handler started');
    }

    /**
     * Stop the giveaway checker
     */
    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    /**
     * Check for giveaways that need to end
     */
    async checkGiveaways() {
        try {
            const now = new Date();
            const endingGiveaways = await Giveaway.find({
                ended: false,
                endsAt: { $lte: now }
            });

            for (const giveaway of endingGiveaways) {
                await this.endGiveaway(giveaway);
            }
        } catch (error) {
            logger.error('Error checking giveaways:', error);
        }
    }

    /**
     * Create a new giveaway
     */
    async createGiveaway(channel, options) {
        const { prize, description, duration, winnersCount, hostId, hostTag, requirements } = options;

        const endsAt = new Date(Date.now() + duration);

        // Create giveaway document (without messageId for now)
        const giveawayData = {
            channelId: channel.id,
            guildId: channel.guild.id,
            prize,
            description: description || '',
            hostId,
            hostTag,
            winnersCount: winnersCount || 1,
            endsAt,
            requirements: requirements || {}
        };

        // Create embed
        const embed = embedBuilder.giveaway(giveawayData, 0);

        // Create button
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('giveaway_enter')
                    .setLabel('Enter')
                    .setEmoji('🎉')
                    .setStyle(ButtonStyle.Primary)
            );

        // Send message
        const message = await channel.send({ embeds: [embed], components: [row] });

        // Save to database with messageId
        giveawayData.messageId = message.id;
        const giveaway = await Giveaway.create(giveawayData);

        logger.success(`Giveaway created: ${prize} in ${channel.guild.name}`);
        return giveaway;
    }

    /**
     * Handle giveaway entry
     */
    async handleEntry(interaction) {
        const giveaway = await Giveaway.findOne({
            messageId: interaction.message.id,
            ended: false
        });

        if (!giveaway) {
            return interaction.reply({
                content: '❌ This giveaway is no longer active!',
                flags: MessageFlags.Ephemeral
            });
        }

        const userId = interaction.user.id;

        // Check if already entered
        if (giveaway.entries.includes(userId)) {
            // Remove entry
            giveaway.entries = giveaway.entries.filter(id => id !== userId);
            await giveaway.save();

            await this.updateGiveawayMessage(giveaway);

            return interaction.reply({
                content: '✅ You left the giveaway!',
                flags: MessageFlags.Ephemeral
            });
        }

        // Check requirements
        const member = interaction.member;
        const userData = await User.findOne({
            odasi: userId,
            odaId: interaction.guild.id
        });

        const { eligible, reason } = await giveaway.checkRequirements(member, userData);

        if (!eligible) {
            return interaction.reply({
                content: `❌ You don't meet the requirements!\n${reason}`,
                flags: MessageFlags.Ephemeral
            });
        }

        // Add entry
        giveaway.entries.push(userId);
        await giveaway.save();

        // Update user stats
        if (userData) {
            userData.giveawaysEntered++;
            await userData.save();
        }

        await this.updateGiveawayMessage(giveaway);

        return interaction.reply({
            content: `✅ You entered the giveaway! There are now **${giveaway.entries.length}** entries.`,
            flags: MessageFlags.Ephemeral
        });
    }

    /**
     * Update giveaway message with current entries
     */
    async updateGiveawayMessage(giveaway) {
        try {
            const channel = await this.client.channels.fetch(giveaway.channelId);
            const message = await channel.messages.fetch(giveaway.messageId);

            const embed = embedBuilder.giveaway(giveaway, giveaway.entries.length);
            await message.edit({ embeds: [embed] });
        } catch (error) {
            logger.error('Error updating giveaway message:', error);
        }
    }

    /**
     * End a giveaway and select winners
     */
    async endGiveaway(giveaway) {
        try {
            const channel = await this.client.channels.fetch(giveaway.channelId);
            const message = await channel.messages.fetch(giveaway.messageId);

            // Select winners
            const winners = giveaway.selectWinners();
            giveaway.winnerIds = winners;
            giveaway.ended = true;
            await giveaway.save();

            // Update embed
            const embed = embedBuilder.giveawayEnded(giveaway, winners);

            // Disable button
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('giveaway_ended')
                        .setLabel('Giveaway Ended')
                        .setEmoji('🎁')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true)
                );

            await message.edit({ embeds: [embed], components: [row] });

            // Announce winners
            if (winners.length > 0) {
                const winnerMentions = winners.map(id => `<@${id}>`).join(', ');
                await channel.send({
                    content: `🎉 Congratulations ${winnerMentions}! You won **${giveaway.prize}**!\n${message.url}`
                });

                // Update winner stats and check achievements
                for (const odasi of winners) {
                    let userData = await User.findOne({ odasi, odaId: giveaway.guildId });
                    if (!userData) {
                        userData = await User.create({ odasi, odaId: giveaway.guildId });
                    }
                    userData.giveawaysWon++;
                    await userData.save();

                    // Check achievements
                    try {
                        const member = await channel.guild.members.fetch(odasi);
                        await achievementChecker.check(userData, this.client, member);
                    } catch (e) {
                        // Member might have left
                    }

                    // Send DM to winner
                    try {
                        const winner = await this.client.users.fetch(odasi);
                        await winner.send({
                            content: `🎉 Congratulations! You won **${giveaway.prize}** in **${channel.guild.name}**!\n${message.url}`
                        });
                    } catch (e) {
                        // DMs might be disabled
                    }
                }
            }

            logger.success(`Giveaway ended: ${giveaway.prize} - ${winners.length} winners`);

        } catch (error) {
            logger.error('Error ending giveaway:', error);
            giveaway.ended = true;
            await giveaway.save();
        }
    }

    /**
     * Reroll a giveaway
     */
    async rerollGiveaway(messageId, count = 1) {
        const giveaway = await Giveaway.findOne({ messageId, ended: true });

        if (!giveaway) {
            return { success: false, message: 'Giveaway not found!' };
        }

        if (giveaway.entries.length === 0) {
            return { success: false, message: 'No entries!' };
        }

        // Select new winners (excluding previous winners)
        const availableEntries = giveaway.entries.filter(id => !giveaway.winnerIds.includes(id));

        if (availableEntries.length === 0) {
            return { success: false, message: 'No remaining entries to reroll!' };
        }

        const newWinners = [];
        const entries = [...availableEntries];

        for (let i = 0; i < Math.min(count, entries.length); i++) {
            const index = Math.floor(Math.random() * entries.length);
            newWinners.push(entries[index]);
            entries.splice(index, 1);
        }

        // Add to winner list
        giveaway.winnerIds.push(...newWinners);
        await giveaway.save();

        return {
            success: true,
            winners: newWinners,
            prize: giveaway.prize
        };
    }
}

module.exports = GiveawayHandler;
