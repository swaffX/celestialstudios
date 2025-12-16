const { Events, EmbedBuilder, AuditLogEvent } = require('discord.js');
const Guild = require('../models/Guild');
const logger = require('../utils/logger');

module.exports = {
    name: Events.MessageDelete,
    once: false,

    async execute(message, client) {
        // Skip if no guild, partial message, or bot message
        if (!message.guild || !message.author || message.author.bot) return;

        try {
            const guildSettings = await Guild.findOne({ guildId: message.guild.id });
            if (!guildSettings?.logs?.enabled || !guildSettings.logs.channels.message) return;

            const logChannel = message.guild.channels.cache.get(guildSettings.logs.channels.message);
            if (!logChannel) return;

            const authorTag = message.author?.tag || 'Unknown User';
            const authorAvatar = message.author?.displayAvatarURL() || null;
            const authorId = message.author?.id || 'Unknown';

            const embed = new EmbedBuilder()
                .setColor('#e74c3c')
                .setAuthor({ name: authorTag, iconURL: authorAvatar })
                .setDescription(`**Message sent by ${message.author || 'Unknown'} deleted in ${message.channel}**\n${message.content || 'No content (Embed/Image)'}`)
                .setFooter({ text: `Author: ${authorId} | Message ID: ${message.id}` })
                .setTimestamp();

            if (message.attachments.size > 0) {
                embed.addFields({ name: 'Attachments', value: `${message.attachments.size} Attachment(s)` });
            }

            await logChannel.send({ embeds: [embed] });

        } catch (error) {
            logger.error('Error logging message delete:', error);
        }
    }
};
