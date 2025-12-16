const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const embedBuilder = require('../../utils/embedBuilder');
const Guild = require('../../models/Guild');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setupapplications')
        .setDescription('Setup the staff application system')
        .addRoleOption(option =>
            option.setName('staff_role')
                .setDescription('Role to give when application is accepted')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            const guild = interaction.guild;
            const staffRole = interaction.options.getRole('staff_role');

            // Create APPLICATIONS category
            let appCategory = guild.channels.cache.find(
                c => c.type === ChannelType.GuildCategory && c.name.toUpperCase().includes('APPLICATION')
            );

            if (!appCategory) {
                appCategory = await guild.channels.create({
                    name: '📋 APPLICATIONS',
                    type: ChannelType.GuildCategory
                });
            }

            // Create panel channel (public)
            let panelChannel = guild.channels.cache.find(
                c => c.name === 'apply' && c.parentId === appCategory.id
            );

            if (!panelChannel) {
                panelChannel = await guild.channels.create({
                    name: '📝・apply',
                    type: ChannelType.GuildText,
                    parent: appCategory.id,
                    topic: 'Click the button below to apply for staff!',
                    permissionOverwrites: [
                        {
                            id: guild.id,
                            deny: ['SendMessages'],
                            allow: ['ViewChannel', 'ReadMessageHistory']
                        },
                        {
                            id: interaction.client.user.id,
                            allow: ['SendMessages', 'ViewChannel', 'EmbedLinks']
                        }
                    ]
                });
            }

            // Create review channel (staff only)
            let reviewChannel = guild.channels.cache.find(
                c => c.name === 'application-review' && c.parentId === appCategory.id
            );

            if (!reviewChannel) {
                reviewChannel = await guild.channels.create({
                    name: '📊・application-review',
                    type: ChannelType.GuildText,
                    parent: appCategory.id,
                    topic: 'Staff application reviews',
                    permissionOverwrites: [
                        {
                            id: guild.id,
                            deny: ['ViewChannel']
                        },
                        {
                            id: staffRole.id,
                            allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
                        },
                        {
                            id: interaction.client.user.id,
                            allow: ['SendMessages', 'ViewChannel', 'EmbedLinks', 'ManageMessages']
                        }
                    ]
                });
            }

            // Save to database
            const guildSettings = await Guild.findOrCreate(guild.id);
            guildSettings.applications = {
                enabled: true,
                categoryId: appCategory.id,
                panelChannelId: panelChannel.id,
                reviewChannelId: reviewChannel.id,
                acceptedRoleId: staffRole.id,
                counter: guildSettings.applications?.counter || 0
            };
            await guildSettings.save();

            // Create panel embed
            const panelEmbed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('📋 Staff Applications')
                .setDescription(
                    `## Join Our Team!\n\n` +
                    `> Are you interested in becoming a staff member?\n` +
                    `> We're always looking for dedicated people!\n\n` +
                    `╭───────────────────────────╮\n\n` +
                    `**Requirements:**\n` +
                    `> ✅ Active in the server\n` +
                    `> ✅ Respectful and helpful\n` +
                    `> ✅ Available to moderate\n` +
                    `> ✅ Familiar with Discord\n\n` +
                    `╰───────────────────────────╯\n\n` +
                    `Click the button below to apply!`
                )
                .setFooter({ text: 'Good luck! 🍀', iconURL: guild.iconURL({ dynamic: true }) })
                .setTimestamp();

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('application_create')
                        .setLabel('Apply Now')
                        .setEmoji('📝')
                        .setStyle(ButtonStyle.Success)
                );

            const panelMessage = await panelChannel.send({ embeds: [panelEmbed], components: [row] });

            guildSettings.applications.panelMessageId = panelMessage.id;
            await guildSettings.save();

            // Success response
            const successEmbed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setTitle('✅ Application System Ready!')
                .setDescription(
                    `**Channels Created:**\n` +
                    `> 📝 Apply: ${panelChannel}\n` +
                    `> 📊 Review: ${reviewChannel}\n\n` +
                    `**Staff Role:** ${staffRole}\n\n` +
                    `Members can now click the button to apply!`
                )
                .setFooter({ text: 'Application system configured' })
                .setTimestamp();

            await interaction.editReply({ embeds: [successEmbed] });
            logger.info(`Application system setup by ${interaction.user.tag}`);

        } catch (error) {
            logger.error('Setup applications error:', error);
            await interaction.editReply({
                embeds: [embedBuilder.error('Error', `Failed to setup applications: ${error.message}`)]
            });
        }
    }
};
