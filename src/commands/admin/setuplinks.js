const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const embedBuilder = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setuplinks')
        .setDescription('Create official links embed with buttons')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('game_url')
                .setDescription('Roblox game URL')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('group_url')
                .setDescription('Roblox group URL')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('tiktok_url')
                .setDescription('TikTok URL (optional)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('banner_url')
                .setDescription('Banner image URL (optional)')
                .setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const gameUrl = interaction.options.getString('game_url');
            const groupUrl = interaction.options.getString('group_url');
            const tiktokUrl = interaction.options.getString('tiktok_url');
            const bannerUrl = interaction.options.getString('banner_url');

            const embed = new EmbedBuilder()
                .setColor('#2B2D31')
                .setAuthor({
                    name: interaction.guild.name.toUpperCase(),
                    iconURL: interaction.guild.iconURL({ dynamic: true })
                })
                .setTitle('🔗 Official Links')
                .setDescription(
                    `> Connect with us across all platforms!\n\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
                )
                .addFields(
                    {
                        name: '🎮 Play Our Game',
                        value: `> Experience the ultimate adventure!\n> [**Click to Play on Roblox**](${gameUrl})`,
                        inline: false
                    },
                    {
                        name: '👥 Join Our Group',
                        value: `> Get exclusive perks and updates!\n> [**Join on Roblox**](${groupUrl})`,
                        inline: false
                    }
                )
                .setFooter({
                    text: '⭐ Follow us everywhere for the latest updates!',
                    iconURL: interaction.guild.iconURL({ dynamic: true })
                })
                .setTimestamp();

            if (tiktokUrl) {
                embed.addFields({
                    name: '🎵 Follow on TikTok',
                    value: `> Behind the scenes & epic moments!\n> [**Follow us**](${tiktokUrl})`,
                    inline: false
                });
            }

            if (bannerUrl) {
                embed.setImage(bannerUrl);
            }

            const buttons = [
                new ButtonBuilder()
                    .setLabel('Play Game')
                    .setEmoji('🎮')
                    .setStyle(ButtonStyle.Link)
                    .setURL(gameUrl),
                new ButtonBuilder()
                    .setLabel('Join Group')
                    .setEmoji('👥')
                    .setStyle(ButtonStyle.Link)
                    .setURL(groupUrl)
            ];

            if (tiktokUrl) {
                buttons.push(
                    new ButtonBuilder()
                        .setLabel('TikTok')
                        .setEmoji('🎵')
                        .setStyle(ButtonStyle.Link)
                        .setURL(tiktokUrl)
                );
            }

            const row = new ActionRowBuilder().addComponents(buttons);

            await interaction.channel.send({ embeds: [embed], components: [row] });

            await interaction.editReply({
                embeds: [embedBuilder.success('Success', 'Links embed created!')]
            });
        } catch (error) {
            console.error('Links command error:', error);
            await interaction.editReply({
                embeds: [embedBuilder.error('Error', 'Failed to create links embed.')]
            });
        }
    }
};
