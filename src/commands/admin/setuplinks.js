const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, MessageFlags } = require('discord.js');
const embedBuilder = require('../../utils/embedBuilder');

const LINKS_BANNER = 'https://lh3.googleusercontent.com/gg-dl/ABS2GSkcV3QR7FOSTWHz8DsxfUPXhuEs63A0skegJGzNkRxaP9w0X2LLfbncg7RqTzdmR5_uApgCeqAeZzirUKprbn3hat8DNWU_HVPx7B1j6ZevIG6sg9HYMxyQU6OsglsZY15OHphMG2yml8T2q8xnCXrztZ8fndgTzBjEtxYhIL7uHIEERg=s1024-rj';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setuplinks')
        .setDescription('Create links embed with multiple custom links')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('link1_name')
                .setDescription('First link name (e.g. YouTube)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('link1_url')
                .setDescription('First link URL')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('link1_emoji')
                .setDescription('First link emoji (e.g. 🎬)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('link2_name')
                .setDescription('Second link name')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('link2_url')
                .setDescription('Second link URL')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('link3_name')
                .setDescription('Third link name')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('link3_url')
                .setDescription('Third link URL')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('link4_name')
                .setDescription('Fourth link name')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('link4_url')
                .setDescription('Fourth link URL')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('link5_name')
                .setDescription('Fifth link name')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('link5_url')
                .setDescription('Fifth link URL')
                .setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            const links = [];

            // Collect all provided links
            for (let i = 1; i <= 5; i++) {
                const name = interaction.options.getString(`link${i}_name`);
                const url = interaction.options.getString(`link${i}_url`);
                const emoji = i === 1 ? interaction.options.getString('link1_emoji') : null;

                if (name && url) {
                    links.push({ name, url, emoji: emoji || '🔗' });
                }
            }

            if (links.length === 0) {
                return interaction.editReply({
                    embeds: [embedBuilder.error('Error', 'Please provide at least one link!')]
                });
            }

            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('🔗 Official Links')
                .setDescription(`Find us here:`)
                .setImage(LINKS_BANNER)
                .setFooter({
                    text: `${interaction.guild.name}`,
                    iconURL: interaction.guild.iconURL({ dynamic: true })
                })
                .setTimestamp();

            // Add link fields
            links.forEach(link => {
                embed.addFields({
                    name: `${link.emoji} ${link.name}`,
                    value: `[Click here](${link.url})`,
                    inline: true
                });
            });

            // Add Terms of Service
            embed.addFields({
                name: '📜 Terms of Service',
                value: '[Discord TOS](https://discord.com/terms)',
                inline: false
            });

            // Create buttons (max 5)
            const buttons = links.slice(0, 5).map(link =>
                new ButtonBuilder()
                    .setLabel(link.name)
                    .setEmoji(link.emoji)
                    .setStyle(ButtonStyle.Link)
                    .setURL(link.url)
            );

            const row = new ActionRowBuilder().addComponents(buttons);

            await interaction.channel.send({ embeds: [embed], components: [row] });

            await interaction.editReply({
                embeds: [embedBuilder.success('Success', `Links embed created with ${links.length} link(s)!`)]
            });
        } catch (error) {
            console.error('Links command error:', error);
            await interaction.editReply({
                embeds: [embedBuilder.error('Error', 'Failed to create links embed.')]
            });
        }
    }
};
