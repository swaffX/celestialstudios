const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const Guild = require('../../models/Guild');
const embedBuilder = require('../../utils/embedBuilder');

const LOG_CHANNELS = [
    { name: 'message-logs', emoji: '📝', description: 'Message edits and deletes' },
    { name: 'member-logs', emoji: '👥', description: 'Member joins and leaves' },
    { name: 'mod-logs', emoji: '🔨', description: 'Moderation actions' },
    { name: 'role-logs', emoji: '🎭', description: 'Role changes' },
    { name: 'channel-logs', emoji: '📁', description: 'Channel updates' },
    { name: 'voice-logs', emoji: '🔊', description: 'Voice activity' },
    { name: 'server-logs', emoji: '⚙️', description: 'Server changes' }
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setuplogs')
        .setDescription('Setup automatic log channels')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create all log channels automatically'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove all log channels'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('View current log channel status')),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const subcommand = interaction.options.getSubcommand();
        const guild = interaction.guild;

        try {
            if (subcommand === 'create') {
                // Create LOGS category
                let logsCategory = guild.channels.cache.find(
                    c => c.type === ChannelType.GuildCategory && c.name.toUpperCase() === 'LOGS'
                );

                if (!logsCategory) {
                    logsCategory = await guild.channels.create({
                        name: '📋 LOGS',
                        type: ChannelType.GuildCategory,
                        permissionOverwrites: [
                            {
                                id: guild.id,
                                deny: ['ViewChannel']
                            },
                            {
                                id: interaction.client.user.id,
                                allow: ['ViewChannel', 'SendMessages', 'EmbedLinks']
                            }
                        ]
                    });
                }

                const createdChannels = {};

                // Create each log channel
                for (const logChannel of LOG_CHANNELS) {
                    let channel = guild.channels.cache.find(
                        c => c.name === logChannel.name && c.parentId === logsCategory.id
                    );

                    if (!channel) {
                        channel = await guild.channels.create({
                            name: logChannel.name,
                            type: ChannelType.GuildText,
                            parent: logsCategory.id,
                            topic: `${logChannel.emoji} ${logChannel.description}`,
                            permissionOverwrites: [
                                {
                                    id: guild.id,
                                    deny: ['ViewChannel']
                                },
                                {
                                    id: interaction.client.user.id,
                                    allow: ['ViewChannel', 'SendMessages', 'EmbedLinks']
                                }
                            ]
                        });
                    }

                    createdChannels[logChannel.name.replace('-logs', '')] = channel.id;
                }

                // Save to database
                await Guild.findOneAndUpdate(
                    { guildId: guild.id },
                    {
                        'logs.enabled': true,
                        'logs.categoryId': logsCategory.id,
                        'logs.channels': {
                            message: createdChannels.message,
                            member: createdChannels.member,
                            mod: createdChannels.mod,
                            role: createdChannels.role,
                            channel: createdChannels.channel,
                            voice: createdChannels.voice,
                            server: createdChannels.server
                        }
                    },
                    { upsert: true }
                );

                const successEmbed = new EmbedBuilder()
                    .setColor('#2ecc71')
                    .setTitle('✅ Log Channels Created')
                    .setDescription(`All log channels have been created under the **${logsCategory.name}** category.`)
                    .addFields(
                        LOG_CHANNELS.map(lc => ({
                            name: `${lc.emoji} ${lc.name}`,
                            value: lc.description,
                            inline: true
                        }))
                    )
                    .setFooter({ text: 'Only admins and the bot can see these channels' })
                    .setTimestamp();

                await interaction.editReply({ embeds: [successEmbed] });

            } else if (subcommand === 'remove') {
                const guildData = await Guild.findOne({ guildId: guild.id });

                if (guildData?.logs?.categoryId) {
                    const category = guild.channels.cache.get(guildData.logs.categoryId);

                    if (category) {
                        // Delete all channels in the category
                        const channelsToDelete = guild.channels.cache.filter(
                            c => c.parentId === category.id
                        );

                        for (const [, channel] of channelsToDelete) {
                            await channel.delete('Log system removed').catch(() => { });
                        }

                        // Delete the category
                        await category.delete('Log system removed').catch(() => { });
                    }
                }

                // Clear from database
                await Guild.findOneAndUpdate(
                    { guildId: guild.id },
                    {
                        'logs.enabled': false,
                        'logs.categoryId': null,
                        'logs.channels': {}
                    }
                );

                await interaction.editReply({
                    embeds: [embedBuilder.success('Removed', 'All log channels have been removed.')]
                });

            } else if (subcommand === 'status') {
                const guildData = await Guild.findOne({ guildId: guild.id });

                const statusEmbed = new EmbedBuilder()
                    .setColor('#5865F2')
                    .setTitle('📊 Log Channel Status')
                    .setTimestamp();

                if (!guildData?.logs?.enabled) {
                    statusEmbed.setDescription('❌ Log system is not configured.\n\nUse `/setuplogs create` to set up log channels.');
                } else {
                    const channels = guildData.logs.channels || {};
                    let statusText = '';

                    for (const logChannel of LOG_CHANNELS) {
                        const key = logChannel.name.replace('-logs', '');
                        const channelId = channels[key];
                        const channel = channelId ? guild.channels.cache.get(channelId) : null;

                        if (channel) {
                            statusText += `${logChannel.emoji} **${logChannel.name}**: <#${channel.id}>\n`;
                        } else {
                            statusText += `${logChannel.emoji} **${logChannel.name}**: ❌ Not found\n`;
                        }
                    }

                    statusEmbed.setDescription(statusText);
                }

                await interaction.editReply({ embeds: [statusEmbed] });
            }

        } catch (error) {
            console.error('Setup logs error:', error);
            await interaction.editReply({
                embeds: [embedBuilder.error('Error', `Failed to setup logs: ${error.message}`)]
            });
        }
    }
};
