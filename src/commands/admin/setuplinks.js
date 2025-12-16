const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const embedBuilder = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setuplinks')
        .setDescription('Create official links embed with YouTube and social links')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('youtube_url')
                .setDescription('YouTube channel URL')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('youtube_name')
                .setDescription('YouTube channel name')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('tiktok_url')
                .setDescription('TikTok URL (optional)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('twitter_url')
                .setDescription('Twitter/X URL (optional)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('instagram_url')
                .setDescription('Instagram URL (optional)')
                .setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const youtubeUrl = interaction.options.getString('youtube_url');
            const youtubeName = interaction.options.getString('youtube_name');
            const tiktokUrl = interaction.options.getString('tiktok_url');
            const twitterUrl = interaction.options.getString('twitter_url');
            const instagramUrl = interaction.options.getString('instagram_url');

            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('🔗 Official Links')
                .setDescription(`Find us here:`)
                .addFields({
                    name: '🎬 YouTube Channel',
                    value: `[${youtubeName}](${youtubeUrl})`,
                    inline: false
                });

            // Add optional social links
            if (tiktokUrl) {
                embed.addFields({
                    name: '🎵 TikTok',
                    value: `[Follow us](${tiktokUrl})`,
                    inline: true
                });
            }

            if (twitterUrl) {
                embed.addFields({
                    name: '🐦 Twitter/X',
                    value: `[Follow us](${twitterUrl})`,
                    inline: true
                });
            }

            if (instagramUrl) {
                embed.addFields({
                    name: '📷 Instagram',
                    value: `[Follow us](${instagramUrl})`,
                    inline: true
                });
            }

            // Terms of Service
            embed.addFields({
                name: '📜 Terms of Service',
                value: '[Discord TOS](https://discord.com/terms) • [YouTube TOS](https://www.youtube.com/t/terms)',
                inline: false
            });

            embed.setFooter({
                text: `${interaction.guild.name} • ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`,
                iconURL: interaction.guild.iconURL({ dynamic: true })
            });

            // Create buttons
            const buttons = [
                new ButtonBuilder()
                    .setLabel('YouTube')
                    .setEmoji('🎬')
                    .setStyle(ButtonStyle.Link)
                    .setURL(youtubeUrl)
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

            if (twitterUrl) {
                buttons.push(
                    new ButtonBuilder()
                        .setLabel('Twitter')
                        .setEmoji('🐦')
                        .setStyle(ButtonStyle.Link)
                        .setURL(twitterUrl)
                );
            }

            if (instagramUrl) {
                buttons.push(
                    new ButtonBuilder()
                        .setLabel('Instagram')
                        .setEmoji('📷')
                        .setStyle(ButtonStyle.Link)
                        .setURL(instagramUrl)
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
