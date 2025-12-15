const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const User = require('../models/User');
const Guild = require('../models/Guild');
const logger = require('../utils/logger');

/**
 * Format duration from minutes to readable string
 */
function formatDuration(minutes) {
    if (!minutes || minutes === 0) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
}

/**
 * Initialize stats embed system
 */
async function initStatsEmbed(client) {
    logger.info('📊 Stats embed system initialized');

    // Update stats embeds periodically (every 30 seconds)
    setInterval(async () => {
        await updateAllStatsEmbeds(client);
    }, 30000);

    // Initial update after 5 seconds
    setTimeout(() => updateAllStatsEmbeds(client), 5000);
}

/**
 * Update all stats embeds
 */
async function updateAllStatsEmbeds(client) {
    try {
        const guilds = await Guild.find({ 'statsEmbed.enabled': true });

        for (const guildData of guilds) {
            const guild = client.guilds.cache.get(guildData.guildId);
            if (!guild || !guildData.statsEmbed?.channelId) continue;

            const channel = guild.channels.cache.get(guildData.statsEmbed.channelId);
            if (!channel) continue;

            const period = guildData.statsEmbed.period || 'weekly';
            const embed = await buildStatsEmbed(guild, period);
            const row = buildPeriodButtons(period);

            const storedMessageId = guildData.statsEmbed?.messageId;

            if (storedMessageId) {
                try {
                    const message = await channel.messages.fetch(storedMessageId);
                    if (message) {
                        await message.edit({ embeds: [embed], components: [row] });
                        continue;
                    }
                } catch (err) {
                    // Message not found, create new one
                    await Guild.findOneAndUpdate(
                        { guildId: guild.id },
                        { 'statsEmbed.messageId': null }
                    );
                }
            }

            // Create new message
            const newMsg = await channel.send({ embeds: [embed], components: [row] });
            await Guild.findOneAndUpdate(
                { guildId: guild.id },
                { 'statsEmbed.messageId': newMsg.id },
                { upsert: true }
            );
        }
    } catch (error) {
        logger.error('Stats embed update error:', error);
    }
}

/**
 * Build stats embed for given period
 */
async function buildStatsEmbed(guild, period = 'weekly') {
    // Get top XP users (all time)
    const topXP = await User.find({ odaId: guild.id })
        .sort({ totalXp: -1 })
        .limit(5);

    // Get top message users for period
    const topMessages = await User.find({ odaId: guild.id })
        .sort({ totalMessages: -1 })
        .limit(5);

    // Get top voice users for period
    const topVoice = await User.find({ odaId: guild.id })
        .sort({ voiceTime: -1 })
        .limit(5);

    const xpLeaders = await buildLeaderboard(guild, topXP, 'xp');
    const msgLeaders = await buildLeaderboard(guild, topMessages, 'messages');
    const voiceLeaders = await buildLeaderboard(guild, topVoice, 'voice');

    // Calculate totals
    const totalUsers = await User.countDocuments({ odaId: guild.id });
    const totalMessagesResult = await User.aggregate([
        { $match: { odaId: guild.id } },
        { $group: { _id: null, total: { $sum: '$totalMessages' } } }
    ]);
    const totalVoiceResult = await User.aggregate([
        { $match: { odaId: guild.id } },
        { $group: { _id: null, total: { $sum: '$voiceTime' } } }
    ]);

    const totalMessages = totalMessagesResult[0]?.total || 0;
    const totalVoice = totalVoiceResult[0]?.total || 0;

    // Calculate next reset time
    const now = new Date();
    let nextResetTimestamp;

    if (period === 'weekly') {
        const dayOfWeek = now.getDay();
        const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek);
        const nextMonday = new Date(now);
        nextMonday.setDate(now.getDate() + daysUntilMonday);
        nextMonday.setHours(0, 0, 0, 0);
        nextResetTimestamp = Math.floor(nextMonday.getTime() / 1000);
    } else {
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0);
        nextResetTimestamp = Math.floor(nextMonth.getTime() / 1000);
    }

    const periodLabel = period === 'weekly' ? 'Weekly' : 'Monthly';

    return new EmbedBuilder()
        .setColor(period === 'weekly' ? '#5865F2' : '#9B59B6')
        .setAuthor({
            name: `📊 Server Statistics — ${periodLabel}`,
            iconURL: guild.iconURL({ dynamic: true })
        })
        .setTitle(guild.name)
        .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
        .addFields(
            {
                name: '🏆 Top XP (All Time)',
                value: xpLeaders || '*No data yet*',
                inline: false
            },
            {
                name: `💬 Top Chatters`,
                value: msgLeaders || '*No activity yet*',
                inline: false
            },
            {
                name: `🎤 Voice Champions`,
                value: voiceLeaders || '*No activity yet*',
                inline: false
            },
            {
                name: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
                value: '\u200b',
                inline: false
            },
            {
                name: '📈 All Time Statistics',
                value: [
                    `👥 **Tracked Users:** \`${totalUsers}\``,
                    `💬 **Total Messages:** \`${totalMessages.toLocaleString()}\``,
                    `🎤 **Total Voice Time:** \`${formatDuration(totalVoice)}\``
                ].join('\n'),
                inline: false
            },
            {
                name: `📅 Period Info`,
                value: [
                    `⏰ **Resets:** <t:${nextResetTimestamp}:R>`
                ].join('\n'),
                inline: false
            }
        )
        .setFooter({ text: 'Last Updated' })
        .setTimestamp();
}

/**
 * Build period switch buttons
 */
function buildPeriodButtons(currentPeriod) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('stats_weekly')
            .setLabel('Weekly')
            .setEmoji('📅')
            .setStyle(currentPeriod === 'weekly' ? ButtonStyle.Primary : ButtonStyle.Secondary)
            .setDisabled(currentPeriod === 'weekly'),
        new ButtonBuilder()
            .setCustomId('stats_monthly')
            .setLabel('Monthly')
            .setEmoji('📆')
            .setStyle(currentPeriod === 'monthly' ? ButtonStyle.Primary : ButtonStyle.Secondary)
            .setDisabled(currentPeriod === 'monthly')
    );
}

/**
 * Handle stats button interaction
 */
async function handleStatsButton(interaction) {
    try {
        await interaction.deferUpdate();

        const period = interaction.customId === 'stats_weekly' ? 'weekly' : 'monthly';
        const embed = await buildStatsEmbed(interaction.guild, period);
        const row = buildPeriodButtons(period);

        // Save period preference
        await Guild.findOneAndUpdate(
            { guildId: interaction.guild.id },
            { 'statsEmbed.period': period }
        );

        await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (error) {
        logger.error('Stats button error:', error);
    }
}

/**
 * Build leaderboard string with mentions
 */
async function buildLeaderboard(guild, users, type) {
    if (!users || users.length === 0) return null;

    const lines = [];
    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

    for (let i = 0; i < Math.min(users.length, 5); i++) {
        const user = users[i];

        let value;
        if (type === 'xp') {
            if (!user.totalXp || user.totalXp === 0) continue;
            value = `Level **${user.level}** • \`${user.totalXp.toLocaleString()} XP\``;
        } else if (type === 'messages') {
            if (!user.totalMessages || user.totalMessages === 0) continue;
            value = `\`${user.totalMessages.toLocaleString()}\` messages`;
        } else if (type === 'voice') {
            if (!user.voiceTime || user.voiceTime === 0) continue;
            value = `\`${formatDuration(user.voiceTime)}\``;
        }

        lines.push(`${medals[i]} <@${user.odasi}> — ${value}`);
    }

    return lines.length > 0 ? lines.join('\n') : null;
}

/**
 * Setup stats embed in a channel
 */
async function setupStatsEmbed(guild, channelId) {
    try {
        const channel = guild.channels.cache.get(channelId);
        if (!channel) return { success: false, error: 'Channel not found' };

        const embed = await buildStatsEmbed(guild, 'weekly');
        const row = buildPeriodButtons('weekly');

        const message = await channel.send({ embeds: [embed], components: [row] });

        await Guild.findOneAndUpdate(
            { guildId: guild.id },
            {
                'statsEmbed.enabled': true,
                'statsEmbed.channelId': channelId,
                'statsEmbed.messageId': message.id,
                'statsEmbed.period': 'weekly'
            },
            { upsert: true }
        );

        return { success: true, messageId: message.id };
    } catch (error) {
        logger.error('Setup stats embed error:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    initStatsEmbed,
    updateAllStatsEmbeds,
    buildStatsEmbed,
    handleStatsButton,
    setupStatsEmbed,
    formatDuration
};
