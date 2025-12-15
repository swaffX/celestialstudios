const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const User = require('../../models/User');
const config = require('../../config');
const embedBuilder = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invites')
        .setDescription('View invite statistics')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to view invite stats for')
                .setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply();

        const targetUser = interaction.options.getUser('user') || interaction.user;

        // Get user data
        let userData = await User.findOne({
            odasi: targetUser.id,
            odaId: interaction.guild.id
        });

        if (!userData) {
            userData = await User.create({
                odasi: targetUser.id,
                odaId: interaction.guild.id
            });
        }

        // Calculate real invites (total - fake + bonus)
        const realInvites = userData.invites;
        const fakeInvites = userData.fakeInvites;
        const bonusInvites = userData.bonusInvites;
        const totalInvites = realInvites + bonusInvites;

        // Check if eligible for special giveaways
        const isEligible = totalInvites >= config.invites.specialGiveawayMinInvites;

        // Get leaderboard position
        const allUsers = await User.find({ odaId: interaction.guild.id })
            .sort({ invites: -1 });
        const rank = allUsers.findIndex(u => u.odasi === targetUser.id) + 1;

        // Get who invited this user
        let invitedByText = 'Unknown';
        if (userData.invitedBy) {
            try {
                const inviter = await interaction.client.users.fetch(userData.invitedBy);
                invitedByText = inviter.tag;
            } catch {
                invitedByText = `<@${userData.invitedBy}>`;
            }
        }

        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`📨 ${targetUser.username} - Invite Statistics`)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .addFields(
                {
                    name: '✅ Valid Invites',
                    value: `\`${realInvites}\``,
                    inline: true
                },
                {
                    name: '❌ Fake Invites',
                    value: `\`${fakeInvites}\``,
                    inline: true
                },
                {
                    name: '🎁 Bonus Invites',
                    value: `\`${bonusInvites}\``,
                    inline: true
                },
                {
                    name: '📊 Total',
                    value: `\`${totalInvites}\``,
                    inline: true
                },
                {
                    name: '🏆 Rank',
                    value: `\`#${rank}\``,
                    inline: true
                },
                {
                    name: '👤 Invited By',
                    value: invitedByText,
                    inline: true
                },
                {
                    name: '🎊 Special Giveaway Access',
                    value: isEligible
                        ? '✅ Yes - You can join special giveaways!'
                        : `❌ No - ${config.invites.specialGiveawayMinInvites - totalInvites} more invites needed`,
                    inline: false
                }
            )
            .setFooter({ text: `Earn ${config.invites.xpPerInvite} XP per invite!` })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
};
