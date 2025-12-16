const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const embedBuilder = require('../../utils/embedBuilder');
const Guild = require('../../models/Guild');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setuproles')
        .setDescription('Create reaction roles embed with notification ping roles')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addRoleOption(option =>
            option.setName('announcements')
                .setDescription('Announcements ping role')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('updates')
                .setDescription('Updates ping role')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('giveaways')
                .setDescription('Giveaways ping role')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('events')
                .setDescription('Events ping role')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('banner_url')
                .setDescription('Banner image URL (optional)')
                .setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const bannerUrl = interaction.options.getString('banner_url');

            const roleMapping = {
                announcements: interaction.options.getRole('announcements').id,
                updates: interaction.options.getRole('updates').id,
                giveaways: interaction.options.getRole('giveaways').id,
                events: interaction.options.getRole('events').id
            };

            const rolesEmbed = new EmbedBuilder()
                .setColor('#2B2D31')
                .setAuthor({
                    name: interaction.guild.name.toUpperCase(),
                    iconURL: interaction.guild.iconURL({ dynamic: true })
                })
                .setTitle('🎭 Notification Roles')
                .setDescription(
                    `> Customize your notification preferences!\n\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                    `**🔔 Available Notifications**\n\n` +
                    `> 📢 **Announcements** - Important news\n` +
                    `> 📋 **Updates** - Patches & updates\n` +
                    `> 🎉 **Giveaways** - Free rewards\n` +
                    `> 🎮 **Events** - Special events\n\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
                )
                .addFields({
                    name: '💡 How to Use',
                    value: '> Click a button to **toggle** the role.\n> Click again to **remove** it.',
                    inline: false
                })
                .setThumbnail(interaction.guild.iconURL({ dynamic: true, size: 512 }))
                .setFooter({
                    text: '🔔 Stay updated with what matters to you!',
                    iconURL: interaction.guild.iconURL({ dynamic: true })
                })
                .setTimestamp();

            if (bannerUrl) {
                rolesEmbed.setImage(bannerUrl);
            }

            // Create button row
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`role_${roleMapping.announcements}`)
                    .setLabel('Announcements')
                    .setEmoji('📢')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`role_${roleMapping.updates}`)
                    .setLabel('Updates')
                    .setEmoji('📋')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`role_${roleMapping.giveaways}`)
                    .setLabel('Giveaways')
                    .setEmoji('🎉')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`role_${roleMapping.events}`)
                    .setLabel('Events')
                    .setEmoji('🎮')
                    .setStyle(ButtonStyle.Danger)
            );

            const message = await interaction.channel.send({
                embeds: [rolesEmbed],
                components: [row]
            });

            // Save to database
            await Guild.findOneAndUpdate(
                { guildId: interaction.guild.id },
                {
                    'reactionRoles.messageId': message.id,
                    'reactionRoles.channelId': interaction.channel.id,
                    'reactionRoles.roles': roleMapping
                },
                { upsert: true }
            );

            await interaction.editReply({
                embeds: [embedBuilder.success('Success', 'Reaction roles embed created! Users can now click buttons to get roles.')]
            });
        } catch (error) {
            console.error('Roles command error:', error);
            await interaction.editReply({
                embeds: [embedBuilder.error('Error', `Failed to create roles embed: ${error.message}`)]
            });
        }
    }
};
