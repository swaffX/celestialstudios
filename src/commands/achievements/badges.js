const { SlashCommandBuilder, EmbedBuilder } = require('discord.js'); const { MessageFlags } = require('discord.js');
const User = require('../../models/User');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('badges')
        .setDescription('View your earned badges')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to view badges for')
                .setRequired(false)),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;

        const userData = await User.findOne({
            odasi: targetUser.id,
            odaId: interaction.guild.id
        });

        if (!userData || userData.badges.length === 0) {
            return interaction.reply({
                content: `❌ **${targetUser.username}** has no badges yet!`,
                flags: MessageFlags.Ephemeral
            });
        }

        const badgeList = userData.badges.map((badge, index) =>
            `${index + 1}. 🏅 **${badge}**`
        ).join('\n');

        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`🏅 ${targetUser.username}'s Badges`)
            .setDescription(badgeList)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: `Total: ${userData.badges.length} badges` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
