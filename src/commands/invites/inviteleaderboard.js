const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../models/User');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('inviteleaderboard')
        .setDescription('View invite leaderboard')
        .addIntegerOption(option =>
            option.setName('page')
                .setDescription('Page number')
                .setRequired(false)
                .setMinValue(1)),

    async execute(interaction) {
        await interaction.deferReply();

        const page = interaction.options.getInteger('page') || 1;
        const perPage = 10;

        // Get total count
        const totalUsers = await User.countDocuments({
            odaId: interaction.guild.id,
            invites: { $gt: 0 }
        });
        const totalPages = Math.ceil(totalUsers / perPage) || 1;
        const validPage = Math.min(Math.max(page, 1), totalPages);

        // Get users for this page (sorted by invites)
        const users = await User.find({
            odaId: interaction.guild.id,
            invites: { $gt: 0 }
        })
            .sort({ invites: -1 })
            .skip((validPage - 1) * perPage)
            .limit(perPage);

        if (users.length === 0) {
            return interaction.editReply({
                content: '❌ No one has invited anyone yet!'
            });
        }

        // Build leaderboard text
        const leaderboardText = [];
        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            const position = (validPage - 1) * perPage + i + 1;

            // Get medal for top 3
            let medal = '';
            if (position === 1) medal = '🥇';
            else if (position === 2) medal = '🥈';
            else if (position === 3) medal = '🥉';
            else medal = `\`${position}.\``;

            // Try to get username
            let username = 'Unknown User';
            try {
                const member = await interaction.guild.members.fetch(user.odasi);
                username = member.user.username;
            } catch {
                // User might have left
            }

            const totalInvites = user.invites + user.bonusInvites;
            const specialAccess = totalInvites >= config.invites.specialGiveawayMinInvites ? '⭐' : '';

            leaderboardText.push(`${medal} **${username}** ${specialAccess}\n└ ✅ ${user.invites} | ❌ ${user.fakeInvites} | 🎁 ${user.bonusInvites}`);
        }

        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle('📨 Invite Leaderboard')
            .setDescription(leaderboardText.join('\n\n'))
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .addFields({
                name: '📋 Legend',
                value: `✅ Valid | ❌ Fake | 🎁 Bonus\n⭐ = Special giveaway access (${config.invites.specialGiveawayMinInvites}+ invites)`,
                inline: false
            })
            .setFooter({ text: `Page ${validPage}/${totalPages} • Total ${totalUsers} inviters` })
            .setTimestamp();

        // Find requester's rank
        const userRank = (await User.find({ odaId: interaction.guild.id }).sort({ invites: -1 }))
            .findIndex(u => u.odasi === interaction.user.id) + 1;

        if (userRank > 0) {
            embed.addFields({
                name: '📍 Your Rank',
                value: `#${userRank}`,
                inline: true
            });
        }

        await interaction.editReply({ embeds: [embed] });
    }
};
