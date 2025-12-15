const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embedBuilder = require('../../utils/embedBuilder');
const Guild = require('../../models/Guild');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user from the server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to ban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the ban')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('delete_messages')
                .setDescription('Days of messages to delete')
                .setRequired(false)
                .setMinValue(0)
                .setMaxValue(7))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const deleteMessageDays = interaction.options.getInteger('delete_messages') || 0;

        // Check if trying to ban self
        if (targetUser.id === interaction.user.id) {
            return interaction.reply({
                embeds: [embedBuilder.error('Error', 'You cannot ban yourself!')],
                ephemeral: true
            });
        }

        // Check if trying to ban bot
        if (targetUser.id === interaction.client.user.id) {
            return interaction.reply({
                embeds: [embedBuilder.error('Error', 'You cannot ban me!')],
                ephemeral: true
            });
        }

        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        // Check hierarchy
        if (member) {
            if (member.roles.highest.position >= interaction.member.roles.highest.position) {
                return interaction.reply({
                    embeds: [embedBuilder.error('Error', 'You cannot ban this user! Their role is equal to or higher than yours.')],
                    ephemeral: true
                });
            }

            if (!member.bannable) {
                return interaction.reply({
                    embeds: [embedBuilder.error('Error', 'I cannot ban this user!')],
                    ephemeral: true
                });
            }
        }

        await interaction.deferReply();

        try {
            // Try to DM user
            try {
                await targetUser.send({
                    embeds: [embedBuilder.error(
                        'Banned',
                        `You have been banned from **${interaction.guild.name}**.\n\n**Reason:** ${reason}`
                    )]
                });
            } catch {
                // DMs disabled
            }

            // Ban the user
            await interaction.guild.members.ban(targetUser.id, {
                reason: `${interaction.user.tag}: ${reason}`,
                deleteMessageDays
            });

            // Log to mod channel
            const guildSettings = await Guild.findOrCreate(interaction.guild.id);
            if (guildSettings.modLogChannel) {
                try {
                    const logChannel = await interaction.client.channels.fetch(guildSettings.modLogChannel);
                    if (logChannel) {
                        await logChannel.send({
                            embeds: [embedBuilder.modAction('BAN', interaction.user, targetUser, reason)]
                        });
                    }
                } catch {
                    // Log channel might be deleted
                }
            }

            await interaction.editReply({
                embeds: [embedBuilder.success('User Banned',
                    `**${targetUser.tag}** has been banned from the server.\n\n**Reason:** ${reason}`
                )]
            });

            logger.info(`${targetUser.tag} was banned by ${interaction.user.tag}`);

        } catch (error) {
            logger.error('Ban error:', error);
            await interaction.editReply({
                embeds: [embedBuilder.error('Error', 'Failed to ban user!')]
            });
        }
    }
};
