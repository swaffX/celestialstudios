const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const Guild = require('../../models/Guild');
const User = require('../../models/User');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('inviterewards')
        .setDescription('View invite milestone rewards'),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const guildSettings = await Guild.findOrCreate(interaction.guild.id);

            if (!guildSettings.inviteRewards?.enabled || !guildSettings.inviteRewards.milestones?.length) {
                return interaction.editReply({
                    content: '❌ Invite rewards are not configured on this server. Ask an admin to run `/setupinviterewards`.'
                });
            }

            // Get user's invite count
            const userData = await User.findOne({
                userId: interaction.user.id,
                guildId: interaction.guild.id
            });

            const totalInvites = userData
                ? (userData.invites?.regular || 0) + (userData.invites?.bonus || 0)
                : 0;

            // Build embed
            const milestones = guildSettings.inviteRewards.milestones.sort((a, b) => a.invites - b.invites);

            let description = `## 📨 Invite Rewards\n\n`;
            description += `> Your invites: **${totalInvites}**\n\n`;
            description += `╭───────────────────────────╮\n\n`;

            for (const milestone of milestones) {
                const achieved = totalInvites >= milestone.invites;
                const emoji = achieved ? '✅' : '⬜';
                const progress = achieved ? '**UNLOCKED**' : `${totalInvites}/${milestone.invites}`;

                description += `${emoji} **${milestone.invites} Invites** → <@&${milestone.roleId}>\n`;
                description += `> Progress: ${progress}\n\n`;
            }

            description += `╰───────────────────────────╯\n\n`;
            description += `*Invite friends with \`/invites\` to earn these rewards!*`;

            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('🎁 Invite Rewards')
                .setDescription(description)
                .setThumbnail(interaction.user.displayAvatarURL({ size: 256 }))
                .setFooter({ text: `Keep inviting to unlock more rewards!` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Invite rewards error:', error);
            await interaction.editReply({
                content: '❌ Failed to fetch invite rewards.'
            });
        }
    }
};
