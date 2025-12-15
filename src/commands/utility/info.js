const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('View server information'),

    async execute(interaction) {
        const { guild } = interaction;

        // Get counts
        const totalMembers = guild.memberCount;
        const onlineMembers = guild.members.cache.filter(m => m.presence?.status !== 'offline').size;
        const botCount = guild.members.cache.filter(m => m.user.bot).size;
        const humanCount = totalMembers - botCount;

        // Get channel counts
        const textChannels = guild.channels.cache.filter(c => c.type === 0).size;
        const voiceChannels = guild.channels.cache.filter(c => c.type === 2).size;
        const categories = guild.channels.cache.filter(c => c.type === 4).size;

        // Get role count
        const roleCount = guild.roles.cache.size - 1; // Exclude @everyone

        // Get boost info
        const boostLevel = guild.premiumTier;
        const boostCount = guild.premiumSubscriptionCount;

        // Get verification level
        const verificationLevels = {
            0: 'None',
            1: 'Low',
            2: 'Medium',
            3: 'High',
            4: 'Very High'
        };

        const createdAt = Math.floor(guild.createdTimestamp / 1000);

        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`ℹ️ ${guild.name}`)
            .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: '👑 Owner', value: `<@${guild.ownerId}>`, inline: true },
                { name: '📅 Created', value: `<t:${createdAt}:R>`, inline: true },
                { name: '🆔 Server ID', value: `\`${guild.id}\``, inline: true },
                { name: '👥 Members', value: `Total: \`${totalMembers}\`\nHumans: \`${humanCount}\`\nBots: \`${botCount}\``, inline: true },
                { name: '💬 Channels', value: `Text: \`${textChannels}\`\nVoice: \`${voiceChannels}\`\nCategories: \`${categories}\``, inline: true },
                { name: '🎭 Roles', value: `\`${roleCount}\``, inline: true },
                { name: '🔒 Verification', value: verificationLevels[guild.verificationLevel], inline: true },
                { name: '💎 Boost Level', value: `Tier ${boostLevel} (${boostCount} boosts)`, inline: true }
            )
            .setFooter({ text: 'Celestial Studios Bot' })
            .setTimestamp();

        if (guild.banner) {
            embed.setImage(guild.bannerURL({ size: 512 }));
        }

        await interaction.reply({ embeds: [embed] });
    }
};
