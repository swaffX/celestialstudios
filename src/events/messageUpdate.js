const { Events, EmbedBuilder } = require('discord.js');
const Guild = require('../models/Guild');
const logger = require('../utils/logger');

module.exports = {
    name: Events.MessageUpdate,
    once: false,

    async execute(oldMessage, newMessage, client) {
        if (!oldMessage.guild || oldMessage.author?.bot) return;
        if (oldMessage.content === newMessage.content) return; // Ignore embed updates

        try {
            const guildSettings = await Guild.findOne({ guildId: newMessage.guild.id });
            if (!guildSettings?.logs?.enabled || !guildSettings.logs.channels.message) return;

            const logChannel = newMessage.guild.channels.cache.get(guildSettings.logs.channels.message);
            if (!logChannel) return;

            const embed = new EmbedBuilder()
                .setColor('#3498db')
                .setAuthor({ name: newMessage.author.tag, iconURL: newMessage.author.displayAvatarURL() })
                .setDescription(`**Message edited in ${newMessage.channel}** [Jump to Message](${newMessage.url})`)
                .addFields(
                    { name: 'Before', value: oldMessage.content || '*No content*', inline: false },
                    { name: 'After', value: newMessage.content || '*No content*', inline: false }
                )
                .setFooter({ text: `User ID: ${newMessage.author.id}` })
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });

        } catch (error) {
            logger.error('Error logging message update:', error);
        }
    }
};
