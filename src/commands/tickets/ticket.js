const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js'); const { MessageFlags } = require('discord.js');
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
                .setDescription('Setup the ticket system')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel for the ticket panel')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('support_role')
                        .setDescription('Support team role')
                        .setRequired(false)))
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
        const channel = interaction.options.getChannel('channel');
        const supportRole = interaction.options.getRole('support_role');

        if (channel.type !== ChannelType.GuildText) {
            return interaction.reply({
                embeds: [embedBuilder.error('Error', 'Please select a text channel!')],
                flags: MessageFlags.Ephemeral
            });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            // Get or create guild settings
            const guildSettings = await Guild.findOrCreate(interaction.guild.id);

            // Create ticket category if not exists
            let category = interaction.guild.channels.cache.find(c => c.name === 'Tickets' && c.type === ChannelType.GuildCategory);

            if (!category) {
                category = await interaction.guild.channels.create({
                    name: 'Tickets',
                    type: ChannelType.GuildCategory,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.id,
                            deny: ['ViewChannel']
                        }
                    ]
                });
            }

            guildSettings.ticketCategory = category.id;
            if (supportRole) {
                guildSettings.ticketSupportRoles = [supportRole.id];
            }

            // Send ticket panel
            const embed = embedBuilder.ticketPanel();
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('ticket_create')
                        .setLabel('Create Ticket')
                        .setEmoji('🎫')
                        .setStyle(ButtonStyle.Primary)
                );

            const panelMessage = await channel.send({ embeds: [embed], components: [row] });

            guildSettings.ticketPanelMessage = panelMessage.id;
            guildSettings.ticketPanelChannel = channel.id;
            await guildSettings.save();

            await interaction.editReply({
                embeds: [embedBuilder.success('Ticket System Setup',
                    `Ticket panel sent to ${channel}!\n\n` +
                    `📁 Category: ${category.name}\n` +
                    `${supportRole ? `👥 Support Role: ${supportRole}` : ''}`
                )]
            });

        } catch (error) {
            logger.error('Ticket setup error:', error);
            await interaction.editReply({
                embeds: [embedBuilder.error('Error', 'Failed to setup ticket system!')]
            });
        }
    },

    async handleCreate(interaction, client) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            const guildSettings = await Guild.findOrCreate(interaction.guild.id);

            // Check for existing open ticket
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

            // Increment ticket counter
            guildSettings.ticketCounter++;
            await guildSettings.save();

            const ticketNumber = guildSettings.ticketCounter;

            // Create ticket channel
            const category = interaction.guild.channels.cache.get(guildSettings.ticketCategory);

            const permissionOverwrites = [
                {
                    id: interaction.guild.id,
                    deny: ['ViewChannel']
                },
                {
                    id: interaction.user.id,
                    allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
                },
                {
                    id: client.user.id,
                    allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'ManageChannels']
                }
            ];

            // Add support roles
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
                parent: category?.id,
                permissionOverwrites
            });

            // Save ticket to database
            await Ticket.create({
                odaId: interaction.guild.id,
                channelId: ticketChannel.id,
                odasi: interaction.user.id,
                userTag: interaction.user.tag,
                ticketNumber
            });

            // Send welcome message in ticket
            const embed = embedBuilder.ticket(interaction.user, ticketNumber);
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('ticket_close')
                        .setLabel('Close Ticket')
                        .setEmoji('🔒')
                        .setStyle(ButtonStyle.Danger)
                );

            await ticketChannel.send({
                content: `${interaction.user}${guildSettings.ticketSupportRoles?.length > 0 ? ` | ${guildSettings.ticketSupportRoles.map(r => `<@&${r}>`).join(' ')}` : ''}`,
                embeds: [embed],
                components: [row]
            });

            await interaction.editReply({
                content: `✅ Ticket created: ${ticketChannel}`
            });

            logger.info(`Ticket #${ticketNumber} created by ${interaction.user.tag}`);

        } catch (error) {
            logger.error('Ticket create error:', error);
            await interaction.editReply({
                content: '❌ Failed to create ticket!'
            });
        }
    },

    async handleClose(interaction, client) {
        const row = new ActionRowBuilder()
            .addComponents(
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
                return interaction.followUp({
                    content: '❌ This is not a ticket channel!',
                    flags: MessageFlags.Ephemeral
                });
            }

            ticket.status = 'closed';
            ticket.closedAt = new Date();
            ticket.closedBy = interaction.user.id;
            await ticket.save();

            await interaction.followUp({
                content: '🔒 Closing ticket...'
            });

            // Delete channel after delay
            setTimeout(async () => {
                try {
                    await interaction.channel.delete();
                } catch (error) {
                    logger.error('Failed to delete ticket channel:', error);
                }
            }, 5000);

            logger.info(`Ticket #${ticket.ticketNumber} closed by ${interaction.user.tag}`);

        } catch (error) {
            logger.error('Ticket close error:', error);
        }
    },

    async handleCloseCommand(interaction, client) {
        const ticket = await Ticket.findOne({ channelId: interaction.channel.id });

        if (!ticket) {
            return interaction.reply({
                embeds: [embedBuilder.error('Error', 'This is not a ticket channel!')],
                flags: MessageFlags.Ephemeral
            });
        }

        await this.handleClose(interaction, client);
    },

    async handleAdd(interaction, client) {
        const targetUser = interaction.options.getUser('user');

        const ticket = await Ticket.findOne({ channelId: interaction.channel.id });

        if (!ticket) {
            return interaction.reply({
                embeds: [embedBuilder.error('Error', 'This is not a ticket channel!')],
                flags: MessageFlags.Ephemeral
            });
        }

        try {
            await interaction.channel.permissionOverwrites.create(targetUser.id, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true
            });

            ticket.addedUsers.push(targetUser.id);
            await ticket.save();

            await interaction.reply({
                embeds: [embedBuilder.success('User Added',
                    `${targetUser} has been added to this ticket.`
                )]
            });

        } catch (error) {
            logger.error('Ticket add error:', error);
            await interaction.reply({
                embeds: [embedBuilder.error('Error', 'Failed to add user!')],
                flags: MessageFlags.Ephemeral
            });
        }
    }
};
