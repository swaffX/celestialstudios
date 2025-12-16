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

        // Initialize if needed (migration support)
        if (typeof userData.invites === 'number') {
            userData.invites = { total: userData.invites, regular: userData.invites, fake: 0, bonus: 0, left: 0 };
            await userData.save();
        }

        // Calculate stats
        const regular = userData.invites.regular || 0;
        const fake = userData.invites.fake || 0;
        const bonus = userData.invites.bonus || 0;
        const left = userData.invites.left || 0;

        // NET Invites = Regular + Bonus - Fake - Leaves
        const totalInvites = (regular + bonus) - (fake + left);

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
                    name: '✅ Regular',
                    value: `\`${regular}\``,
                    inline: true
                },
                {
                    name: '🎁 Bonus',
                    value: `\`${bonus}\``,
                    inline: true
                },
                {
                    name: '❌ Left/Fake',
                    value: `\`${left + fake}\``,
                    inline: true
                },
                {
                    name: '📊 Net Total',
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
