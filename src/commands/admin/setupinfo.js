const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const embedBuilder = require('../../utils/embedBuilder');

const INFO_BANNER = 'https://cdn.discordapp.com/attachments/531892263652032522/1448019391617695804/Gemini_Generated_Image_q7xuisq7xuisq7xu.png';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setupinfo')
        .setDescription('Create info center with category dropdown and auto role detection')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            const infoEmbed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('ℹ️ Information Center')
                .setDescription(
                    `**Welcome to ${interaction.guild.name}!**\n\n` +
                    `Use the dropdown menu below to navigate to different info sections.\n\n` +
                    `💡 Don't forget to read the rules!`
                )
                .setImage(INFO_BANNER)
                .setFooter({
                    text: `${interaction.guild.name} • ${new Date().toLocaleDateString('en-US')} ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
                    iconURL: interaction.guild.iconURL({ dynamic: true })
                });

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
