const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../models/User');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('View server leaderboard')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Leaderboard type')
                .setRequired(false)
                .addChoices(
                    { name: 'XP', value: 'xp' },
                    { name: 'Level', value: 'level' },
                    { name: 'Messages', value: 'messages' },
                    { name: 'Voice', value: 'voice' }
                ))
        .addIntegerOption(option =>
            option.setName('page')
                .setDescription('Page number')
                .setRequired(false)
                .setMinValue(1)),

    async execute(interaction) {
        await interaction.deferReply();

        const type = interaction.options.getString('type') || 'xp';
        const page = interaction.options.getInteger('page') || 1;
        const perPage = 10;

        // Determine sort field
        let sortField = 'totalXp';
        let displayField = 'XP';
        let formatValue = (user) => `${user.totalXp.toLocaleString()} XP`;

        switch (type) {
            case 'level':
                sortField = 'level';
                displayField = 'Level';
                formatValue = (user) => `Level ${user.level}`;
                break;
            case 'messages':
                sortField = 'totalMessages';
                displayField = 'Messages';
                formatValue = (user) => `${user.totalMessages.toLocaleString()} messages`;
                break;
            case 'voice':
                sortField = 'voiceTime';
                displayField = 'Voice Time';
                formatValue = (user) => {
                    const hours = Math.floor(user.voiceTime / 60);
                    const minutes = user.voiceTime % 60;
                    return `${hours}h ${minutes}m`;
                };
                break;
        }

        // Get total count
        const totalUsers = await User.countDocuments({
            odaId: interaction.guild.id,
            [sortField]: { $gt: 0 }
        });
        const totalPages = Math.ceil(totalUsers / perPage) || 1;
        const validPage = Math.min(Math.max(page, 1), totalPages);

        // Get users for this page
        const users = await User.find({
            odaId: interaction.guild.id,
            [sortField]: { $gt: 0 }
        })
            .sort({ [sortField]: -1 })
            .skip((validPage - 1) * perPage)
            .limit(perPage);

        if (users.length === 0) {
            return interaction.editReply({
                content: '❌ No users on the leaderboard yet!'
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

            // Highlight requester
            const isRequester = user.odasi === interaction.user.id;
            const highlight = isRequester ? ' ⬅️' : '';

            leaderboardText.push(`${medal} **${username}**${highlight}\n└ ${formatValue(user)}`);
        }

        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`🏆 ${displayField} Leaderboard`)
            .setDescription(leaderboardText.join('\n\n'))
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .setFooter({ text: `Page ${validPage}/${totalPages} • Total ${totalUsers} users` })
            .setTimestamp();

        // Find requester's rank
        const userRank = (await User.find({ odaId: interaction.guild.id }).sort({ [sortField]: -1 }))
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
