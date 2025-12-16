const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, PermissionFlagsBits } = require('discord.js');
const embedBuilder = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setupinfo')
        .setDescription('Create info center with category dropdown')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addStringOption(option =>
            option.setName('banner_url')
                .setDescription('Banner image URL')
                .setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const bannerUrl = interaction.options.getString('banner_url');

            const infoEmbed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('ℹ️ Information Center')
                .setDescription(
                    `**Welcome to ${interaction.guild.name}!**\n\n` +
                    `Use the dropdown menu below to navigate to different info sections.\n\n` +
                    `💡 Don't forget to read the rules!`
                )
                .setFooter({
                    text: `${interaction.guild.name} • ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`,
                    iconURL: interaction.guild.iconURL({ dynamic: true })
                });

            if (bannerUrl) {
                infoEmbed.setImage(bannerUrl);
            }

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('info_select')
                .setPlaceholder('Select a category...')
                .addOptions([
                    {
                        label: 'Roles',
                        description: 'View available server roles',
                        value: 'info_roles',
                        emoji: '🛡️'
                    },
                    {
                        label: 'Links',
                        description: 'View important links',
                        value: 'info_links',
                        emoji: '🔗'
                    },
                    {
                        label: 'CC Requirements',
                        description: 'Content Creator requirements',
                        value: 'info_cc',
                        emoji: '📋'
                    }
                ]);

            const row = new ActionRowBuilder().addComponents(selectMenu);

            await interaction.channel.send({ embeds: [infoEmbed], components: [row] });

            await interaction.editReply({
                embeds: [embedBuilder.success('Success', 'Info center created!')]
            });
        } catch (error) {
            console.error('Info command error:', error);
            await interaction.editReply({
                embeds: [embedBuilder.error('Error', 'Failed to create info center.')]
            });
        }
    }
};
