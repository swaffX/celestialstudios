const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const User = require('../../models/User');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('View a user\'s warnings')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to view warnings for')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');

        const userData = await User.findOne({
            odasi: targetUser.id,
            odaId: interaction.guild.id
        });

        if (!userData || userData.warnings.length === 0) {
            return interaction.reply({
                content: `✅ **${targetUser.tag}** has no warnings.`,
                ephemeral: true
            });
        }

        const warningList = userData.warnings.map((warn, index) => {
            const date = Math.floor(warn.date.getTime() / 1000);
            return `**${index + 1}.** ${warn.reason}\n└ Moderator: ${warn.moderatorTag}\n└ Date: <t:${date}:R>`;
        }).join('\n\n');

        const embed = new EmbedBuilder()
            .setColor(config.warningColor)
            .setTitle(`⚠️ ${targetUser.tag} - Warnings`)
            .setDescription(warningList)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: `Total: ${userData.warnings.length} warnings` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
