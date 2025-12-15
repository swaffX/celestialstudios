const { EmbedBuilder } = require('discord.js');
const config = require('../config');

const embedBuilder = {
    // Success embed
    success: (title, description) => {
        return new EmbedBuilder()
            .setColor(config.successColor)
            .setTitle(`✅ ${title}`)
            .setDescription(description)
            .setTimestamp();
    },

    // Error embed
    error: (title, description) => {
        return new EmbedBuilder()
            .setColor(config.errorColor)
            .setTitle(`❌ ${title}`)
            .setDescription(description)
            .setTimestamp();
    },

    // Warning embed
    warning: (title, description) => {
        return new EmbedBuilder()
            .setColor(config.warningColor)
            .setTitle(`⚠️ ${title}`)
            .setDescription(description)
            .setTimestamp();
    },

    // Info embed
    info: (title, description) => {
        return new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(title)
            .setDescription(description)
            .setTimestamp();
    },

    // Level up embed
    levelUp: (user, newLevel) => {
        return new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle('🎉 Level Up!')
            .setDescription(`Congratulations ${user}! You are now **Level ${newLevel}**!`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '📊 New Level', value: `\`${newLevel}\``, inline: true }
            )
            .setTimestamp();
    },

    // Achievement unlock embed
    achievement: (user, achievement) => {
        return new EmbedBuilder()
            .setColor('#ffd700')
            .setTitle('🏆 Achievement Unlocked!')
            .setDescription(`${user} unlocked a new achievement!`)
            .addFields(
                { name: achievement.name, value: achievement.description, inline: false },
                { name: '🏅 Badge', value: achievement.badge, inline: true },
                { name: '⭐ XP Reward', value: `+${achievement.xpReward} XP`, inline: true }
            )
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .setTimestamp();
    },

    // Giveaway embed
    giveaway: (giveawayData, entriesCount = 0) => {
        const timeLeft = Math.max(0, giveawayData.endsAt - Date.now());
        const endTimestamp = Math.floor(giveawayData.endsAt.getTime() / 1000);

        const embed = new EmbedBuilder()
            .setColor('#ff6b6b')
            .setTitle('🎁 GIVEAWAY')
            .setDescription(`**${giveawayData.prize}**\n\n${giveawayData.description || ''}`)
            .addFields(
                { name: '🏆 Winners', value: `${giveawayData.winnersCount}`, inline: true },
                { name: '📝 Entries', value: `${entriesCount}`, inline: true },
                { name: '⏰ Ends', value: `<t:${endTimestamp}:R>`, inline: true },
                { name: '👤 Hosted by', value: `<@${giveawayData.hostId}>`, inline: true }
            )
            .setFooter({ text: 'Click 🎉 to enter!' })
            .setTimestamp(giveawayData.endsAt);

        // Add requirements if any
        const req = giveawayData.requirements;
        const reqTexts = [];

        if (req.requiredRoles && req.requiredRoles.length > 0) {
            reqTexts.push(`• Required Role: ${req.requiredRoles.map(r => `<@&${r}>`).join(', ')}`);
        }
        if (req.minLevel > 0) {
            reqTexts.push(`• Minimum Level: ${req.minLevel}`);
        }
        if (req.minMessages > 0) {
            reqTexts.push(`• Minimum Messages: ${req.minMessages}`);
        }
        if (req.minAccountAge > 0) {
            reqTexts.push(`• Minimum Account Age: ${req.minAccountAge} days`);
        }
        if (req.minServerAge > 0) {
            reqTexts.push(`• Minimum Server Age: ${req.minServerAge} days`);
        }
        if (req.minInvites > 0) {
            reqTexts.push(`• 📨 Minimum Invites: ${req.minInvites} (Special Giveaway!)`);
        }

        if (reqTexts.length > 0) {
            embed.addFields({
                name: '📋 Requirements',
                value: reqTexts.join('\n'),
                inline: false
            });
        }

        return embed;
    },

    // Giveaway ended embed
    giveawayEnded: (giveawayData, winners) => {
        const winnerMentions = winners.length > 0
            ? winners.map(id => `<@${id}>`).join(', ')
            : 'Not enough participants!';

        return new EmbedBuilder()
            .setColor('#2f3136')
            .setTitle('🎁 GIVEAWAY ENDED')
            .setDescription(`**${giveawayData.prize}**`)
            .addFields(
                { name: '🏆 Winners', value: winnerMentions, inline: false },
                { name: '📝 Total Entries', value: `${giveawayData.entries.length}`, inline: true },
                { name: '👤 Hosted by', value: `<@${giveawayData.hostId}>`, inline: true }
            )
            .setTimestamp();
    },

    // Welcome embed
    welcome: (member, guildSettings) => {
        const message = guildSettings.welcomeMessage
            .replace('{user}', member.toString())
            .replace('{username}', member.user.username)
            .replace('{server}', member.guild.name)
            .replace('{memberCount}', member.guild.memberCount);

        return new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle('👋 Welcome!')
            .setDescription(message)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: '📊 Member Count', value: `${member.guild.memberCount}`, inline: true },
                { name: '📅 Joined', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
            )
            .setTimestamp();
    },

    // Farewell embed
    farewell: (member, guildSettings) => {
        const message = guildSettings.farewellMessage
            .replace('{user}', member.user.username)
            .replace('{username}', member.user.username)
            .replace('{server}', member.guild.name)
            .replace('{memberCount}', member.guild.memberCount);

        return new EmbedBuilder()
            .setColor('#95a5a6')
            .setTitle('👋 Goodbye!')
            .setDescription(message)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
            .setTimestamp();
    },

    // Moderation embed
    modAction: (action, moderator, target, reason, duration = null) => {
        const embed = new EmbedBuilder()
            .setColor(config.warningColor)
            .setTitle(`🔨 ${action}`)
            .addFields(
                { name: '👤 User', value: `${target} (${target.id})`, inline: true },
                { name: '👮 Moderator', value: `${moderator}`, inline: true },
                { name: '📝 Reason', value: reason || 'No reason provided', inline: false }
            )
            .setTimestamp();

        if (duration) {
            embed.addFields({ name: '⏱️ Duration', value: duration, inline: true });
        }

        return embed;
    },

    // Ticket embed
    ticket: (user, ticketNumber) => {
        return new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`🎫 Support Ticket #${ticketNumber}`)
            .setDescription(`Hello ${user}!\n\nOur support team will assist you shortly.\nPlease describe your issue in detail.`)
            .addFields(
                { name: '📋 Status', value: '🟢 Open', inline: true },
                { name: '👤 Opened by', value: `${user}`, inline: true }
            )
            .setTimestamp();
    },

    // Ticket panel embed
    ticketPanel: () => {
        return new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle('🎫 Support System')
            .setDescription('Need help?\n\nClick the button below to create a support ticket. Our team will get back to you as soon as possible.')
            .addFields(
                { name: '📌 Important', value: 'Please read the rules before opening a ticket and describe your issue in detail.', inline: false }
            )
            .setFooter({ text: 'Celestial Studios Support' })
            .setTimestamp();
    }
};

module.exports = embedBuilder;
