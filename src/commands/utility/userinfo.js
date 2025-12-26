const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../models/User');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('View user information')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to get info about')
                .setRequired(false)),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        const createdAt = Math.floor(targetUser.createdTimestamp / 1000);

        // Get bot data
        let userData = await User.findOne({
            userId: targetUser.id,
            guildId: interaction.guild.id
        });

        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`👤 ${targetUser.username}`)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: '🆔 User ID', value: `\`${targetUser.id}\``, inline: true },
                { name: '📅 Account Created', value: `<t:${createdAt}:R>`, inline: true },
                { name: '🤖 Bot', value: targetUser.bot ? 'Yes' : 'No', inline: true }
            );

        if (member) {
            const joinedAt = Math.floor(member.joinedTimestamp / 1000);
            const roles = member.roles.cache
                .filter(r => r.id !== interaction.guild.id)
                .sort((a, b) => b.position - a.position)
                .map(r => r.toString())
                .slice(0, 10)
                .join(', ') || 'None';

            embed.addFields(
                { name: '📥 Joined Server', value: `<t:${joinedAt}:R>`, inline: true },
                { name: '📋 Top Roles', value: roles, inline: false }
            );

            if (member.nickname) {
                embed.addFields({ name: '📝 Nickname', value: member.nickname, inline: true });
            }
        }

        if (userData) {
            embed.addFields(
                { name: '📊 Level', value: `${userData.level}`, inline: true },
                { name: '⭐ Total XP', value: `${userData.totalXp.toLocaleString()}`, inline: true },
                { name: '💬 Messages', value: `${userData.totalMessages.toLocaleString()}`, inline: true },
                { name: '📨 Invites', value: `${userData.invites + userData.bonusInvites}`, inline: true },
                { name: '🏅 Badges', value: `${userData.badges.length}`, inline: true },
                { name: '🔥 Streak', value: `${userData.currentStreak} days`, inline: true }
            );
        }

        embed.setFooter({ text: 'Celestial Studios Bot' }).setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
