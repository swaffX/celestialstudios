const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js'); const { MessageFlags } = require('discord.js');
const embedBuilder = require('../../utils/embedBuilder');
const User = require('../../models/User');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clearwarnings')
        .setDescription('Clear all warnings from a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to clear warnings from')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');

        const userData = await User.findOne({
            odasi: targetUser.id,
            odaId: interaction.guild.id
        });

        if (!userData || userData.warnings.length === 0) {
            return interaction.reply({
                content: `✅ **${targetUser.tag}** already has no warnings.`,
                flags: MessageFlags.Ephemeral
            });
        }

        const warningCount = userData.warnings.length;
        userData.warnings = [];
        await userData.save();

        await interaction.reply({
            embeds: [embedBuilder.success('Warnings Cleared',
                `Cleared **${warningCount}** warnings from **${targetUser.tag}**.`
            )]
        });

        logger.info(`${interaction.user.tag} cleared ${warningCount} warnings from ${targetUser.tag}`);
    }
};
