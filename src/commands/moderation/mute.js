const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js'); const { MessageFlags } = require('discord.js');
const ms = require('ms');
const embedBuilder = require('../../utils/embedBuilder');
const Guild = require('../../models/Guild');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Mute (timeout) a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to mute')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Mute duration (e.g. 1h, 30m, 1d)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the mute')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const durationStr = interaction.options.getString('duration');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        const duration = ms(durationStr);
        if (!duration || duration < 1000 || duration > 2419200000) { // Max 28 days
            return interaction.reply({
                embeds: [embedBuilder.error('Error', 'Invalid duration! Must be between 1 second and 28 days.')],
                flags: MessageFlags.Ephemeral
            });
        }

        if (targetUser.id === interaction.user.id) {
            return interaction.reply({
                embeds: [embedBuilder.error('Error', 'You cannot mute yourself!')],
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
                embeds: [embedBuilder.error('Error', 'You cannot mute this user!')],
                flags: MessageFlags.Ephemeral
            });
        }

        if (!member.moderatable) {
            return interaction.reply({
                embeds: [embedBuilder.error('Error', 'I cannot mute this user!')],
                flags: MessageFlags.Ephemeral
            });
        }

        await interaction.deferReply();

        try {
            await member.timeout(duration, `${interaction.user.tag}: ${reason}`);

            try {
                await targetUser.send({
                    embeds: [embedBuilder.warning(
                        'Muted',
                        `You have been muted in **${interaction.guild.name}**.\n\n**Duration:** ${durationStr}\n**Reason:** ${reason}`
                    )]
                });
            } catch { }

            const guildSettings = await Guild.findOrCreate(interaction.guild.id);
            if (guildSettings.modLogChannel) {
                try {
                    const logChannel = await interaction.client.channels.fetch(guildSettings.modLogChannel);
                    if (logChannel) {
                        await logChannel.send({
                            embeds: [embedBuilder.modAction('MUTE', interaction.user, targetUser, reason, durationStr)]
                        });
                    }
                } catch { }
            }

            await interaction.editReply({
                embeds: [embedBuilder.success('User Muted',
                    `**${targetUser.tag}** has been muted.\n\n**Duration:** ${durationStr}\n**Reason:** ${reason}`
                )]
            });

            logger.info(`${targetUser.tag} was muted for ${durationStr} by ${interaction.user.tag}`);

        } catch (error) {
            logger.error('Mute error:', error);
            await interaction.editReply({
                embeds: [embedBuilder.error('Error', 'Failed to mute user!')]
            });
        }
    }
};
