const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js'); const { MessageFlags } = require('discord.js');
const embedBuilder = require('../../utils/embedBuilder');
const { setupStatsEmbed } = require('../../systems/statsEmbedSystem');
const Guild = require('../../models/Guild');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setupstats')
        .setDescription('Setup the stats leaderboard embed')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel for stats leaderboard embed')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');

        if (channel.type !== 0) {
            return interaction.reply({
                embeds: [embedBuilder.error('Error', 'Please select a text channel!')],
                flags: MessageFlags.Ephemeral
            });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            const result = await setupStatsEmbed(interaction.guild, channel.id);

            if (result.success) {
                await interaction.editReply({
                    embeds: [embedBuilder.success('Stats Embed Setup',
                        `Stats leaderboard created in ${channel}!\n\n` +
                        `**Features:**\n` +
                        `🏆 Top XP (All Time)\n` +
                        `💬 Top Chatters\n` +
                        `🎤 Voice Champions\n` +
                        `📊 Server Statistics\n\n` +
                        `Use the buttons to switch between Weekly/Monthly views.\n` +
                        `Embed auto-updates every 30 seconds.`
                    )]
                });
            } else {
                await interaction.editReply({
                    embeds: [embedBuilder.error('Error', `Failed to setup stats embed: ${result.error}`)]
                });
            }
        } catch (error) {
            console.error('Setup stats error:', error);
            await interaction.editReply({
                embeds: [embedBuilder.error('Error', 'Failed to setup stats embed!')]
            });
        }
    }
};
