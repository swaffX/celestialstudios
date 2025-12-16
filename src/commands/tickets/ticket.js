const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const embedBuilder = require('../../utils/embedBuilder');
const Guild = require('../../models/Guild');
const Ticket = require('../../models/Ticket');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Ticket system commands')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Auto-setup ticket system (Category + Panel)'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('close')
                .setDescription('Close this ticket'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a user to this ticket')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to add')
                        .setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'setup':
                await this.handleSetup(interaction, client);
                break;
            case 'close':
                await this.handleCloseCommand(interaction, client);
                break;
            case 'add':
                await this.handleAdd(interaction, client);
                break;
        }
    },

    async handleSetup(interaction, client) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            const guild = interaction.guild;
            const guildSettings = await Guild.findOrCreate(guild.id);

            // Create Ticket Category
            let category = guild.channels.cache.find(c => c.name === 'Tickets' && c.type === ChannelType.GuildCategory);

            if (!category) {
                category = await guild.channels.create({
                    name: 'Tickets',
                    type: ChannelType.GuildCategory,
                    permissionOverwrites: [
                        {
                            id: guild.id,
                            deny: ['ViewChannel']
                        }
                    ]
                });
            }

            // Create Ticket Panel Channel
            let panelChannel = guild.channels.cache.find(c => c.name === 'ticket-panel' && c.parentId === category.id);

            if (!panelChannel) {
                panelChannel = await guild.channels.create({
                    name: 'ticket-panel',
                    type: ChannelType.GuildText,
                    parent: category.id,
                    permissionOverwrites: [
                        {
                            id: guild.id,
                            allow: ['ViewChannel', 'ReadMessageHistory'],
                            deny: ['SendMessages']
                        }
                    ]
                });
            }

            // Save settings
            guildSettings.ticketCategory = category.id;
            guildSettings.ticketPanelChannel = panelChannel.id;
            await guildSettings.save();

            // Send panel
            const embed = embedBuilder.ticketPanel();
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('ticket_create')
                        .setLabel('Create Ticket')
                        .setEmoji('🎫')
                        .setStyle(ButtonStyle.Primary)
                );

            const panelMessage = await panelChannel.send({ embeds: [embed], components: [row] });
            guildSettings.ticketPanelMessage = panelMessage.id;
            await guildSettings.save();

            await interaction.editReply({
                embeds: [embedBuilder.success('Setup Complete',
                    `Ticket system setup successfully!\n` +
                    `> Category: **${category.name}**\n` +
                    `> Panel Channel: ${panelChannel}`
                )]
            });

        } catch (error) {
            logger.error('Ticket setup error:', error);
            await interaction.editReply({
                embeds: [embedBuilder.error('Error', 'Failed to setup ticket system!')]
            });
        }
    },

    // ... (rest of the code remains similar, mostly copy-paste but ensuring English)
    async handleCreate(interaction, client) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            const guildSettings = await Guild.findOrCreate(interaction.guild.id);

            const existingTicket = await Ticket.findOne({
                odaId: interaction.guild.id,
                odasi: interaction.user.id,
                status: 'open'
            });

            if (existingTicket) {
                return interaction.editReply({
                    content: `❌ You already have an open ticket: <#${existingTicket.channelId}>`
                });
            }

            guildSettings.ticketCounter++;
            await guildSettings.save();
            const ticketNumber = guildSettings.ticketCounter;

            // Ensure category exists
            let category = interaction.guild.channels.cache.get(guildSettings.ticketCategory);
            if (!category) {
                category = await interaction.guild.channels.create({
                    name: 'Tickets',
                    type: ChannelType.GuildCategory,
                    permissionOverwrites: [{ id: interaction.guild.id, deny: ['ViewChannel'] }]
                });
                guildSettings.ticketCategory = category.id;
                await guildSettings.save();
            }

            const permissionOverwrites = [
                { id: interaction.guild.id, deny: ['ViewChannel'] },
                { id: interaction.user.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] },
                { id: client.user.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'ManageChannels'] }
            ];

            if (guildSettings.ticketSupportRoles) {
                for (const roleId of guildSettings.ticketSupportRoles) {
                    permissionOverwrites.push({
                        id: roleId,
                        allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
                    });
                }
            }

            const ticketChannel = await interaction.guild.channels.create({
                name: `ticket-${ticketNumber}`,
                type: ChannelType.GuildText,
                parent: category.id,
                permissionOverwrites
            });

            await Ticket.create({
                odaId: interaction.guild.id,
                channelId: ticketChannel.id,
                userId: interaction.user.id, // Fixed: odasi -> userId
                userTag: interaction.user.tag,
                ticketNumber
            });

            const embed = embedBuilder.ticket(interaction.user, ticketNumber);
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket_close')
                    .setLabel('Close Ticket')
                    .setEmoji('🔒')
                    .setStyle(ButtonStyle.Danger)
            );

            await ticketChannel.send({
                content: `${interaction.user}`,
                embeds: [embed],
                components: [row]
            });

            await interaction.editReply({ content: `✅ Ticket created: ${ticketChannel}` });
            logger.info(`Ticket #${ticketNumber} created by ${interaction.user.tag}`);

        } catch (error) {
            logger.error('Ticket create error:', error);
            await interaction.editReply({ content: '❌ Failed to create ticket!' });
        }
    },

    async handleClose(interaction, client) {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('ticket_close_confirm')
                .setLabel('Yes, Close')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('ticket_close_cancel')
                .setLabel('Cancel')
                .setStyle(ButtonStyle.Secondary)
        );

        await interaction.reply({
            content: '⚠️ Are you sure you want to close this ticket?',
            components: [row],
            flags: MessageFlags.Ephemeral
        });
    },

    async handleCloseConfirm(interaction, client) {
        await interaction.deferUpdate();

        try {
            const ticket = await Ticket.findOne({ channelId: interaction.channel.id });

            if (!ticket) {
                return interaction.followUp({ content: '❌ Not a ticket channel!', flags: MessageFlags.Ephemeral });
            }

            ticket.status = 'closed';
            ticket.closedAt = new Date();
            ticket.closedBy = interaction.user.id;
            await ticket.save();

            await interaction.followUp({ content: '🔒 Closing ticket...' });

            setTimeout(async () => {
                try {
                    await interaction.channel.delete();
                } catch (error) {
                    logger.error('Failed to delete ticket channel:', error);
                }
            }, 5000);

        } catch (error) {
            logger.error('Ticket close error:', error);
        }
    },

    async handleCloseCommand(interaction, client) {
        const ticket = await Ticket.findOne({ channelId: interaction.channel.id });
        if (!ticket) {
            return interaction.reply({ embeds: [embedBuilder.error('Error', 'Not a ticket channel!')], flags: MessageFlags.Ephemeral });
        }
        await this.handleClose(interaction, client);
    },

    async handleAdd(interaction, client) {
        const targetUser = interaction.options.getUser('user');
        const ticket = await Ticket.findOne({ channelId: interaction.channel.id });

        if (!ticket) {
            return interaction.reply({ embeds: [embedBuilder.error('Error', 'Not a ticket channel!')], flags: MessageFlags.Ephemeral });
        }

        try {
            await interaction.channel.permissionOverwrites.create(targetUser.id, {
                ViewChannel: true, SendMessages: true, ReadMessageHistory: true
            });

            ticket.addedUsers.push(targetUser.id);
            await ticket.save();

            await interaction.reply({ embeds: [embedBuilder.success('User Added', `${targetUser} added to ticket.`)] });

        } catch (error) {
            logger.error('Ticket add error:', error);
            await interaction.reply({ embeds: [embedBuilder.error('Error', 'Failed to add user!')], flags: MessageFlags.Ephemeral });
        }
    }
};
