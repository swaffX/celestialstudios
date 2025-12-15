const { SlashCommandBuilder, EmbedBuilder, version } = require('discord.js');
const User = require('../../models/User');
const Guild = require('../../models/Guild');
const Giveaway = require('../../models/Giveaway');
const config = require('../../config');
const os = require('os');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('View bot statistics'),

    async execute(interaction) {
        await interaction.deferReply();

        const client = interaction.client;

        // Get counts
        const totalServers = client.guilds.cache.size;
        const totalUsers = client.users.cache.size;
        const totalChannels = client.channels.cache.size;

        // Get database counts
        const totalDbUsers = await User.countDocuments();
        const totalDbGuilds = await Guild.countDocuments();
        const activeGiveaways = await Giveaway.countDocuments({ ended: false });

        // Uptime
        const uptime = client.uptime;
        const days = Math.floor(uptime / 86400000);
        const hours = Math.floor((uptime % 86400000) / 3600000);
        const minutes = Math.floor((uptime % 3600000) / 60000);
        const uptimeStr = `${days}d ${hours}h ${minutes}m`;

        // Memory usage
        const memUsage = process.memoryUsage();
        const memUsed = (memUsage.heapUsed / 1024 / 1024).toFixed(2);
        const memTotal = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);

        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle('📊 Bot Statistics')
            .setThumbnail(client.user.displayAvatarURL())
            .addFields(
                { name: '🌐 Servers', value: `\`${totalServers}\``, inline: true },
                { name: '👥 Users', value: `\`${totalUsers}\``, inline: true },
                { name: '💬 Channels', value: `\`${totalChannels}\``, inline: true },
                { name: '📁 DB Users', value: `\`${totalDbUsers}\``, inline: true },
                { name: '🏠 DB Guilds', value: `\`${totalDbGuilds}\``, inline: true },
                { name: '🎁 Active Giveaways', value: `\`${activeGiveaways}\``, inline: true },
                { name: '⏱️ Uptime', value: `\`${uptimeStr}\``, inline: true },
                { name: '💾 Memory', value: `\`${memUsed} MB\``, inline: true },
                { name: '📡 Ping', value: `\`${Math.round(client.ws.ping)}ms\``, inline: true },
                { name: '📦 discord.js', value: `\`v${version}\``, inline: true },
                { name: '🟢 Node.js', value: `\`${process.version}\``, inline: true },
                { name: '💻 Platform', value: `\`${os.platform()}\``, inline: true }
            )
            .setFooter({ text: 'Celestial Studios Bot' })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
};
