const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Guild = require('../../models/Guild');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('settings')
        .setDescription('View server settings')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        const guildSettings = await Guild.findOrCreate(interaction.guild.id);

        const features = guildSettings.features;
        const featureStatus = (enabled) => enabled ? '✅' : '❌';

        // Format channels
        const formatChannel = (id) => id ? `<#${id}>` : '`Not set`';

        // Format roles
        const formatRoles = (roles) => {
            if (!roles || roles.length === 0) return '`None`';
            return roles.map(r => `<@&${r}>`).join(', ');
        };

        // Format level roles
        const formatLevelRoles = (levelRoles) => {
            if (!levelRoles || levelRoles.length === 0) return '`None`';
            return levelRoles
                .sort((a, b) => a.level - b.level)
                .map(r => `Level ${r.level}: <@&${r.roleId}>`)
                .join('\n');
        };

        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`⚙️ ${interaction.guild.name} - Settings`)
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .addFields(
                {
                    name: '📺 Channels',
                    value: [
                        `**Level:** ${formatChannel(guildSettings.levelChannel)}`,
                        `**Welcome:** ${formatChannel(guildSettings.welcomeChannel)}`,
                        `**Farewell:** ${formatChannel(guildSettings.farewellChannel)}`,
                        `**Mod Log:** ${formatChannel(guildSettings.modLogChannel)}`,
                        `**Giveaway:** ${formatChannel(guildSettings.giveawayChannel)}`
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '🎭 Roles',
                    value: [
                        `**Auto Role:** ${formatRoles(guildSettings.autoRoles)}`,
                        `**Moderator:** ${formatRoles(guildSettings.modRoles)}`,
                        `**Ticket Support:** ${formatRoles(guildSettings.ticketSupportRoles)}`
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '📊 Level Roles',
                    value: formatLevelRoles(guildSettings.levelRoles),
                    inline: false
                },
                {
                    name: '🔧 Features',
                    value: [
                        `${featureStatus(features.leveling)} Leveling System`,
                        `${featureStatus(features.welcome)} Welcome`,
                        `${featureStatus(features.farewell)} Farewell`,
                        `${featureStatus(features.moderation)} Moderation`,
                        `${featureStatus(features.tickets)} Tickets`,
                        `${featureStatus(features.giveaways)} Giveaways`
                    ].join('\n'),
                    inline: false
                }
            )
            .setFooter({ text: 'Use the respective commands to change settings' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
