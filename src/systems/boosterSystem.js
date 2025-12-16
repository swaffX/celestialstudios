const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const Guild = require('../models/Guild');
const logger = require('../utils/logger');

/**
 * Initialize the booster system
 */
async function initBoosterSystem(client) {
    logger.info('🚀 Booster system initialized');

    // Initial fetch to ensure cache is populated
    for (const [id, guild] of client.guilds.cache) {
        try {
            await guild.members.fetch();
        } catch (err) {
            logger.error(`Failed to fetch members for ${guild.name}:`, err);
        }
    }

    // Update booster embeds periodically (every 2 minutes)
    setInterval(() => {
        updateAllBoosterEmbeds(client);
    }, 120000);
}

/**
 * Create or update the booster leaderboard embed
 */
async function updateBoosterEmbed(guild, channelId, bannerUrl = null) {
    try {
        const channel = guild.channels.cache.get(channelId);
        if (!channel) {
            logger.warn('Boost channel not found:', channelId);
            return null;
        }

        // Get all boosters - convert to array properly
        const boostersArray = Array.from(
            guild.members.cache
                .filter(member => member.premiumSince)
                .values()
        ).sort((a, b) => a.premiumSince - b.premiumSince);

        const boostLevel = guild.premiumTier;
        const boostCount = guild.premiumSubscriptionCount || 0;
        const boostEmoji = getBoostEmoji(boostLevel);

        // Calculate next level requirements
        const nextLevelReqs = {
            0: { next: 2, perks: 'Custom Emojis, Better Audio' },
            1: { next: 7, perks: 'More Emojis, Upload Limit 50MB' },
            2: { next: 14, perks: 'Vanity URL, Banner, 100MB Uploads' },
            3: { next: 0, perks: 'All perks unlocked!' }
        };

        const levelInfo = nextLevelReqs[boostLevel];
        const boostsForNext = Math.max(0, levelInfo.next - boostCount);

        // Calculate average boosts per person
        const avgBoostsPerPerson = boostersArray.length > 0
            ? Math.ceil(boostCount / boostersArray.length)
            : 0;

        // Build booster list with avatars and time
        const boosterListLines = boostersArray.slice(0, 15).map((member, index) => {
            const boostTime = member.premiumSince;
            const daysBoosting = Math.floor((Date.now() - boostTime.getTime()) / (1000 * 60 * 60 * 24));

            let medal = '';
            if (index === 0) medal = '👑';
            else if (index === 1) medal = '🥈';
            else if (index === 2) medal = '🥉';
            else medal = `\`${index + 1}.\``;

            // Show estimated boost count
            const boostTier = avgBoostsPerPerson > 1 ? ` • 💎 ${avgBoostsPerPerson}x Boost` : '';

            return `${medal} <@${member.id}>\n> ⏱️ **${daysBoosting}** days${boostTier} • <t:${Math.floor(boostTime.getTime() / 1000)}:R>`;
        });

        const embed = new EmbedBuilder()
            .setColor('#FF73FA')
            .setAuthor({
                name: 'SERVER BOOSTERS',
                iconURL: guild.iconURL({ dynamic: true })
            })
            .setTitle(`${boostEmoji} ${guild.name}`)
            .setDescription(
                `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                `💎 **Boost Statistics**\n\n` +
                `> 🚀 **Total Boosts:** \`${boostCount}\`\n` +
                `> ⚡ **Boost Level:** \`Level ${boostLevel}\`\n` +
                `> 👥 **Active Boosters:** \`${boostersArray.length}\`\n` +
                (boostLevel < 3 ? `> 📈 **Next Level:** \`${boostsForNext}\` more boosts\n` : '') +
                `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
            )
            .addFields(
                {
                    name: `🏆 Booster Hall of Fame (${boostersArray.length})`,
                    value: boostersArray.length > 0
                        ? boosterListLines.join('\n\n')
                        : '> *No boosters yet. Be the first to boost!* 💫',
                    inline: false
                }
            )
            .setThumbnail(guild.iconURL({ dynamic: true, size: 512 }))
            .setFooter({
                text: `💖 Thank you for supporting ${guild.name}!`
            })
            .setTimestamp();

        // Add perks info for current level
        if (boostLevel > 0) {
            const currentPerks = [
                boostLevel >= 1 ? '✅ 100 Emoji Slots' : '',
                boostLevel >= 1 ? '✅ 128kbps Audio' : '',
                boostLevel >= 2 ? '✅ 50MB Upload Limit' : '',
                boostLevel >= 2 ? '✅ Custom Server Banner' : '',
                boostLevel >= 3 ? '✅ Vanity URL' : '',
                boostLevel >= 3 ? '✅ 100MB Upload Limit' : ''
            ].filter(p => p).join('\n');

            embed.addFields({
                name: '✨ Current Perks',
                value: `\`\`\`\n${currentPerks}\n\`\`\``,
                inline: false
            });
        }

        // Add banner if provided
        if (bannerUrl) {
            embed.setImage(bannerUrl);
        }

        // Add extra info if many boosters
        if (boostersArray.length > 15) {
            embed.addFields({
                name: '📋 More Boosters',
                value: `> *...and ${boostersArray.length - 15} more amazing boosters!*`,
                inline: false
            });
        }

        // Get guild data for stored message ID
        const guildData = await Guild.findOne({ guildId: guild.id });
        const storedMessageId = guildData?.boosterSystem?.messageId;
        const storedChannelId = guildData?.boosterSystem?.channelId;

        // Try to edit existing message first
        if (storedMessageId && storedChannelId === channelId) {
            try {
                const existingMessage = await channel.messages.fetch(storedMessageId);
                if (existingMessage) {
                    await existingMessage.edit({ embeds: [embed] });
                    return existingMessage;
                }
            } catch (err) {
                // Only create new message if the old one is truly gone (Unknown Message)
                if (err.code === 10008) {
                    await Guild.findOneAndUpdate(
                        { guildId: guild.id },
                        { 'boosterSystem.messageId': null }
                    );
                } else {
                    // Start-up network glitches or other errors - don't duplicate
                    logger.warn(`Failed to fetch booster message: ${err.message}`);
                    return null;
                }
            }
        }

        // Only send new message if no existing message found
        const message = await channel.send({ embeds: [embed] });
        await saveBoosterMessageId(guild.id, message.id, channelId, bannerUrl);
        return message;
    } catch (error) {
        logger.error('Booster embed update error:', error);
        return null;
    }
}

/**
 * Save the booster message ID to database
 */
async function saveBoosterMessageId(guildId, messageId, channelId, bannerUrl) {
    await Guild.findOneAndUpdate(
        { guildId },
        {
            'boosterSystem.enabled': true,
            'boosterSystem.messageId': messageId,
            'boosterSystem.channelId': channelId,
            'boosterSystem.bannerUrl': bannerUrl
        },
        { upsert: true }
    );
}

/**
 * Handle new boost event
 */
async function handleNewBoost(member, client) {
    const guild = member.guild;

    try {
        const guildData = await Guild.findOne({ guildId: guild.id });
        const channelId = guildData?.boosterSystem?.channelId;

        if (!channelId) return;

        const channel = guild.channels.cache.get(channelId);
        if (!channel) return;

        const boostCount = guild.premiumSubscriptionCount || 0;
        const boostLevel = guild.premiumTier;
        const boosterCount = guild.members.cache.filter(m => m.premiumSince).size;

        // Modern thank you embed
        const thankEmbed = new EmbedBuilder()
            .setColor('#FF73FA')
            .setAuthor({
                name: '🎉 NEW SERVER BOOST!',
                iconURL: guild.iconURL({ dynamic: true })
            })
            .setTitle(`Thank you, ${member.user.username}!`)
            .setDescription(
                `<@${member.id}> just boosted **${guild.name}**! 💖\n\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                `> 🚀 **Total Boosts:** \`${boostCount}\`\n` +
                `> ⚡ **Boost Level:** \`Level ${boostLevel}\`\n` +
                `> 👥 **Total Boosters:** \`${boosterCount}\`\n\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                `Your support helps unlock amazing perks for everyone! ✨`
            )
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 512 }))
            .setFooter({
                text: `${guild.name} • Boosted just now!`,
                iconURL: guild.iconURL({ dynamic: true })
            })
            .setTimestamp();

        await channel.send({ content: `<@${member.id}>`, embeds: [thankEmbed] });
        logger.info(`🚀 Boost notification sent for ${member.user.tag}`);

        // Update the booster leaderboard embed
        if (guildData?.boosterSystem?.enabled) {
            await updateBoosterEmbed(guild, guildData.boosterSystem.channelId, guildData.boosterSystem.bannerUrl);
        }

        // Send DM to booster
        try {
            const dmEmbed = new EmbedBuilder()
                .setColor('#FF73FA')
                .setTitle('💖 Thank You for Boosting!')
                .setDescription([
                    `Hey **${member.user.username}**!`,
                    '',
                    `Thank you so much for boosting **${guild.name}**! 🎉`,
                    '',
                    `Your support means the world to us and helps make the server even better!`,
                    '',
                    `As a booster, you now have access to exclusive perks. Enjoy! ✨`
                ].join('\n'))
                .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
                .setFooter({ text: guild.name })
                .setTimestamp();

            await member.send({ embeds: [dmEmbed] });
        } catch (dmError) {
            // DMs disabled
        }

    } catch (error) {
        logger.error('New boost handler error:', error);
    }
}

/**
 * Update all booster embeds across guilds
 */
async function updateAllBoosterEmbeds(client) {
    try {
        const guilds = await Guild.find({ 'boosterSystem.enabled': true });

        for (const guildData of guilds) {
            const guild = client.guilds.cache.get(guildData.guildId);
            if (guild && guildData.boosterSystem?.channelId) {
                await updateBoosterEmbed(guild, guildData.boosterSystem.channelId, guildData.boosterSystem.bannerUrl);
            }
        }
    } catch (error) {
        logger.error('Update all booster embeds error:', error);
    }
}

/**
 * Get boost emoji based on level
 */
function getBoostEmoji(level) {
    const emojis = ['🚀', '🔮', '💎', '👑'];
    return emojis[level] || '🚀';
}

module.exports = {
    initBoosterSystem,
    updateBoosterEmbed,
    handleNewBoost,
    updateAllBoosterEmbeds
};
