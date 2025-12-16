const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js'); const { MessageFlags } = require('discord.js');
const embedBuilder = require('../../utils/embedBuilder');
const Guild = require('../../models/Guild');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a user from the server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to kick')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the kick')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        if (targetUser.id === interaction.user.id) {
            return interaction.reply({
                embeds: [embedBuilder.error('Error', 'You cannot kick yourself!')],
                flags: MessageFlags.Ephemeral
            });
        }

        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        if (!member) {
            return interaction.reply({
                embeds: [embedBuilder.error('Error', 'User not found in server!')],
                flags: MessageFlags.Ephemeral
            });
        }

        if (member.roles.highest.position >= interaction.member.roles.highest.position) {
            return interaction.reply({
                embeds: [embedBuilder.error('Error', 'You cannot kick this user!')],
                flags: MessageFlags.Ephemeral
            });
        }

        if (!member.kickable) {
            return interaction.reply({
                embeds: [embedBuilder.error('Error', 'I cannot kick this user!')],
                flags: MessageFlags.Ephemeral
            });
        }

        await interaction.deferReply();

        try {
            try {
                await targetUser.send({
                    embeds: [embedBuilder.warning(
                        'Kicked',
                        `You have been kicked from **${interaction.guild.name}**.\n\n**Reason:** ${reason}`
                    )]
                });
            } catch { }

            await member.kick(`${interaction.user.tag}: ${reason}`);

            const guildSettings = await Guild.findOrCreate(interaction.guild.id);
            if (guildSettings.modLogChannel) {
                try {
                    const logChannel = await interaction.client.channels.fetch(guildSettings.modLogChannel);
                    if (logChannel) {
                        await logChannel.send({
                            embeds: [embedBuilder.modAction('KICK', interaction.user, targetUser, reason)]
                        });
                    }
                } catch { }
            }

            await interaction.editReply({
                embeds: [embedBuilder.success('User Kicked',
                    `**${targetUser.tag}** has been kicked from the server.\n\n**Reason:** ${reason}`
                )]
            });

            logger.info(`${targetUser.tag} was kicked by ${interaction.user.tag}`);

        } catch (error) {
            logger.error('Kick error:', error);
            await interaction.editReply({
                embeds: [embedBuilder.error('Error', 'Failed to kick user!')]
            });
        }
    }
};
