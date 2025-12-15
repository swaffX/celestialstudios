const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('View a user\'s avatar')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to get avatar of')
                .setRequired(false)),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;

        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`🖼️ ${targetUser.username}'s Avatar`)
            .setImage(targetUser.displayAvatarURL({ dynamic: true, size: 512 }))
            .addFields(
                {
                    name: '🔗 Links', value: [
                        `[PNG](${targetUser.displayAvatarURL({ extension: 'png', size: 512 })})`,
                        `[JPG](${targetUser.displayAvatarURL({ extension: 'jpg', size: 512 })})`,
                        `[WEBP](${targetUser.displayAvatarURL({ extension: 'webp', size: 512 })})`
                    ].join(' • '), inline: false
                }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
