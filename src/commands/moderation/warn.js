const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embedBuilder = require('../../utils/embedBuilder');
const User = require('../../models/User');
const Guild = require('../../models/Guild');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to warn')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the warning')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');

        if (targetUser.bot) {
            return interaction.reply({
                embeds: [embedBuilder.error('Error', 'You cannot warn bots!')],
                ephemeral: true
            });
        }

        await interaction.deferReply();

        try {
            // Get or create user
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

            // Add warning
            userData.warnings.push({
                reason,
                moderatorId: interaction.user.id,
                moderatorTag: interaction.user.tag,
                date: new Date()
            });

            await userData.save();

            const warningCount = userData.warnings.length;

            // DM the user
            try {
                await targetUser.send({
                    embeds: [embedBuilder.warning(
                        'Warning Received',
                        `You have received a warning in **${interaction.guild.name}**.\n\n**Reason:** ${reason}\n**Total Warnings:** ${warningCount}`
                    )]
                });
            } catch { }

            // Log to mod channel
            const guildSettings = await Guild.findOrCreate(interaction.guild.id);
            if (guildSettings.modLogChannel) {
                try {
                    const logChannel = await interaction.client.channels.fetch(guildSettings.modLogChannel);
                    if (logChannel) {
                        await logChannel.send({
                            embeds: [embedBuilder.modAction('WARN', interaction.user, targetUser, reason)]
                        });
                    }
                } catch { }
            }

            await interaction.editReply({
                embeds: [embedBuilder.success('User Warned',
                    `**${targetUser.tag}** has been warned.\n\n**Reason:** ${reason}\n**Total Warnings:** ${warningCount}`
                )]
            });

            logger.info(`${targetUser.tag} was warned by ${interaction.user.tag}: ${reason}`);

        } catch (error) {
            logger.error('Warn error:', error);
            await interaction.editReply({
                embeds: [embedBuilder.error('Error', 'Failed to warn user!')]
            });
        }
    }
};
