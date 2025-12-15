const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embedBuilder = require('../../utils/embedBuilder');
const { createStatsChannels, deleteStatsChannels } = require('../../systems/serverStatsSystem');
const Guild = require('../../models/Guild');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverstats')
        .setDescription('Manage server stats voice channels')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Create server stats voice channels'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove server stats channels'))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        await interaction.deferReply({ ephemeral: true });

        if (subcommand === 'setup') {
            // Check if already exists
            const guildData = await Guild.findOne({ guildId: interaction.guild.id });
            if (guildData?.serverStats?.enabled) {
                return interaction.editReply({
                    embeds: [embedBuilder.error('Error', 'Server stats already exist! Use `/serverstats remove` first.')]
                });
            }

            const result = await createStatsChannels(interaction.guild);

            if (result.success) {
                await interaction.editReply({
                    embeds: [embedBuilder.success('Server Stats Created',
                        `Created stats channels:\n\n` +
                        `📁 Category: **📊 SERVER STATS**\n` +
                        `👥 All Members channel\n` +
                        `👤 Members channel\n` +
                        `🤖 Bots channel\n\n` +
                        `Stats will auto-update every 5 minutes.`
                    )]
                });
            } else {
                await interaction.editReply({
                    embeds: [embedBuilder.error('Error', `Failed to create stats channels: ${result.error}`)]
                });
            }
        } else if (subcommand === 'remove') {
            const guildData = await Guild.findOne({ guildId: interaction.guild.id });

            if (!guildData?.serverStats?.enabled) {
                return interaction.editReply({
                    embeds: [embedBuilder.error('Error', 'Server stats are not set up!')]
                });
            }

            const success = await deleteStatsChannels(interaction.guild, guildData.serverStats.channelIds);

            if (success) {
                await interaction.editReply({
                    embeds: [embedBuilder.success('Server Stats Removed', 'Server stats channels have been deleted.')]
                });
            } else {
                await interaction.editReply({
                    embeds: [embedBuilder.error('Error', 'Failed to remove stats channels.')]
                });
            }
        }
    }
};
