const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embedBuilder = require('../../utils/embedBuilder');
const { updateBoosterEmbed } = require('../../systems/boosterSystem');
const Guild = require('../../models/Guild');

const BOOSTER_BANNER = 'https://cdn.discordapp.com/attachments/531892263652032522/1448040840642691236/Gemini_Generated_Image_e3ipe2e3ipe2e3ip.png';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setupbooster')
        .setDescription('Setup the booster leaderboard system')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel for booster leaderboard')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('banner')
                .setDescription('Banner image URL (optional)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');
        const banner = interaction.options.getString('banner');

        if (channel.type !== 0) {
            return interaction.reply({
                embeds: [embedBuilder.error('Error', 'Please select a text channel!')],
                ephemeral: true
            });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            // Update or create the booster embed
            const message = await updateBoosterEmbed(interaction.guild, channel.id, banner || BOOSTER_BANNER);

            if (!message) {
                return interaction.editReply({
                    embeds: [embedBuilder.error('Error', 'Failed to create booster embed!')]
                });
            }

            await interaction.editReply({
                embeds: [embedBuilder.success('Booster System Setup',
                    `Booster leaderboard created in ${channel}!\n\n` +
                    `The embed will auto-update every 2 minutes.\n` +
                    `New boosters will get a thank you message and DM.`
                )]
            });
        } catch (error) {
            console.error('Setup booster error:', error);
            await interaction.editReply({
                embeds: [embedBuilder.error('Error', 'Failed to setup booster system!')]
            });
        }
    }
};
