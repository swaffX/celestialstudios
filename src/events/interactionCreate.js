const { Events, EmbedBuilder, MessageFlags } = require('discord.js');
const logger = require('../utils/logger');
const embedBuilder = require('../utils/embedBuilder');
const { handleStatsButton } = require('../systems/statsEmbedSystem');

// Help categories
const helpCategories = {
    leveling: {
        emoji: '📊', name: 'Leveling', color: '#3498db', commands: [
            { name: '/rank', desc: 'View your level and XP' },
            { name: '/leaderboard', desc: 'View server leaderboard' },
            { name: '/setlevelchannel', desc: 'Set level-up channel' },
            { name: '/addlevelrole', desc: 'Add level role reward' }
        ]
    },
    giveaway: {
        emoji: '🎁', name: 'Giveaways', color: '#e74c3c', commands: [
            { name: '/giveaway create', desc: 'Create a giveaway' },
            { name: '/giveaway end', desc: 'End a giveaway early' },
            { name: '/giveaway reroll', desc: 'Reroll winners' },
            { name: '/giveaway list', desc: 'List active giveaways' }
        ]
    },
    invites: {
        emoji: '📨', name: 'Invites', color: '#9b59b6', commands: [
            { name: '/invites', desc: 'View invite statistics' },
            { name: '/inviteleaderboard', desc: 'View invite leaderboard' },
            { name: '/addinvites', desc: 'Add bonus invites' }
        ]
    },
    moderation: {
        emoji: '🛡️', name: 'Moderation', color: '#e67e22', commands: [
            { name: '/ban', desc: 'Ban a user' },
            { name: '/kick', desc: 'Kick a user' },
            { name: '/mute', desc: 'Timeout a user' },
            { name: '/warn', desc: 'Warn a user' },
            { name: '/warnings', desc: 'View warnings' },
            { name: '/clearwarnings', desc: 'Clear warnings' }
        ]
    },
    setup: {
        emoji: '⚙️', name: 'Setup', color: '#2ecc71', commands: [
            { name: '/setupwelcome', desc: 'Auto-create welcome system' },
            { name: '/setupgiveaway', desc: 'Auto-create giveaway channel' },
            { name: '/setupmarketplace', desc: 'Create marketplace channels' },
            { name: '/setuplevel', desc: 'Setup leveling system' },
            { name: '/setuplogs', desc: 'Setup log channels' },
            { name: '/setupinfo', desc: 'Create info center' },
            { name: '/setuprules', desc: 'Create rules embed' },
            { name: '/setuplinks', desc: 'Create links embed' },
            { name: '/setuproles', desc: 'Create role buttons' },
            { name: '/setupbooster', desc: 'Booster leaderboard' }
        ]
    },
    tickets: {
        emoji: '🎫', name: 'Tickets', color: '#1abc9c', commands: [
            { name: '/ticket setup', desc: 'Setup ticket system' },
            { name: '/ticket support-role', desc: 'Add/remove support roles' },
            { name: '/ticket close', desc: 'Close a ticket' },
            { name: '/ticket add', desc: 'Add user to ticket' }
        ]
    },
    marketplace: {
        emoji: '🛒', name: 'Marketplace', color: '#f1c40f', commands: [
            { name: 'Hiring', desc: 'Post job offers' },
            { name: 'For Hire', desc: 'Offer your services' },
            { name: 'Portfolios', desc: 'Showcase your work' },
            { name: 'Selling', desc: 'Sell your assets' }
        ]
    },
    utility: {
        emoji: '🔧', name: 'Utility', color: '#95a5a6', commands: [
            { name: '/help', desc: 'View all commands' },
            { name: '/ping', desc: 'Check bot latency' },
            { name: '/serverinfo', desc: 'Server information' },
            { name: '/userinfo', desc: 'User information' },
            { name: '/avatar', desc: 'View avatar' }
        ]
    }
};

module.exports = {
    name: Events.InteractionCreate,
    once: false,

    async execute(interaction, client) {
        // Handle slash commands
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);

            if (!command) {
                logger.warn(`Unknown command: ${interaction.commandName}`);
                return;
            }

            try {
                logger.command(
                    interaction.user.tag,
                    interaction.commandName,
                    interaction.guild?.name || 'DM'
                );

                await command.execute(interaction, client);

            } catch (error) {
                logger.error(`Error executing ${interaction.commandName}:`, error);

                const errorEmbed = embedBuilder.error(
                    'Error',
                    'An error occurred while executing the command.'
                );

                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
                } else {
                    await interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
                }
            }
        }

        // Handle button interactions
        if (interaction.isButton()) {
            try {
                // Giveaway entry button
                if (interaction.customId === 'giveaway_enter') {
                    await client.giveawayHandler.handleEntry(interaction);
                    return;
                }

                // Stats embed period buttons
                if (interaction.customId === 'stats_weekly' || interaction.customId === 'stats_monthly') {
                    await handleStatsButton(interaction);
                    return;
                }

                // Help home button
                if (interaction.customId === 'help_home') {
                    const HELP_BANNER = 'https://cdn.discordapp.com/attachments/1447262708440236084/1450284176564818063/Gemini_Generated_Image_eyxkuceyxkuceyxk.png';

                    const mainEmbed = new EmbedBuilder()
                        .setColor('#5865F2')
                        .setAuthor({
                            name: `${interaction.client.user.username} • Command Center`,
                            iconURL: interaction.client.user.displayAvatarURL()
                        })
                        .setDescription(
                            `> 👋 Hey **${interaction.user.username}**!\n` +
                            `> \n` +
                            `> Select a category below to explore commands.\n` +
                            `> Each category contains useful features!\n\n` +
                            `╭──────────────────────────╮`
                        )
                        .setImage(HELP_BANNER)
                        .setFooter({
                            text: `📚 ${Object.values(helpCategories).reduce((sum, cat) => sum + cat.commands.length, 0)} Total Commands`,
                            iconURL: interaction.user.displayAvatarURL()
                        })
                        .setTimestamp();

                    for (const [key, cat] of Object.entries(helpCategories)) {
                        mainEmbed.addFields({
                            name: `${cat.emoji} **${cat.name}**`,
                            value: `\`\`\`${cat.commands.length} cmds\`\`\``,
                            inline: true
                        });
                    }

                    await interaction.update({ embeds: [mainEmbed] });
                    return;
                }

                // Reaction role buttons (role_ROLEID)
                if (interaction.customId.startsWith('role_')) {
                    const roleId = interaction.customId.replace('role_', '');
                    const role = interaction.guild.roles.cache.get(roleId);

                    if (!role) {
                        return interaction.reply({ content: '❌ Role not found!', flags: MessageFlags.Ephemeral });
                    }

                    const member = interaction.member;

                    if (member.roles.cache.has(roleId)) {
                        await member.roles.remove(roleId);
                        await interaction.reply({
                            content: `✅ Removed **${role.name}** role!`,
                            flags: MessageFlags.Ephemeral
                        });
                    } else {
                        await member.roles.add(roleId);
                        await interaction.reply({
                            content: `✅ Added **${role.name}** role!`,
                            flags: MessageFlags.Ephemeral
                        });
                    }
                    return;
                }

                // Ticket buttons
                if (interaction.customId === 'ticket_create') {
                    const ticketCommand = client.commands.get('ticket');
                    if (ticketCommand && ticketCommand.handleCreate) {
                        await ticketCommand.handleCreate(interaction, client);
                    }
                    return;
                }

                if (interaction.customId === 'ticket_close') {
                    const ticketCommand = client.commands.get('ticket');
                    if (ticketCommand && ticketCommand.handleClose) {
                        await ticketCommand.handleClose(interaction, client);
                    }
                    return;
                }

                if (interaction.customId === 'ticket_close_confirm') {
                    const ticketCommand = client.commands.get('ticket');
                    if (ticketCommand && ticketCommand.handleCloseConfirm) {
                        await ticketCommand.handleCloseConfirm(interaction, client);
                    }
                    return;
                }

                // Marketplace Buttons
                if (interaction.customId.startsWith('marketplace_create_')) {
                    const { showModal } = require('../handlers/marketplaceHandler');
                    const type = interaction.customId.replace('marketplace_create_', '');
                    await showModal(interaction, type);
                    return;
                }

            } catch (error) {
                logger.error('Error handling button interaction:', error);

                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: '❌ An error occurred!',
                        flags: MessageFlags.Ephemeral
                    });
                }
            }
        }

        // Handle select menus
        if (interaction.isStringSelectMenu()) {
            try {
                // Help category dropdown
                if (interaction.customId === 'help_select') {
                    const value = interaction.values[0];
                    const categoryKey = value.replace('help_', '');
                    const cat = helpCategories[categoryKey];

                    if (cat) {
                        const commandList = cat.commands.map(c => `> \`${c.name}\` — ${c.desc}`).join('\n');

                        const embed = new EmbedBuilder()
                            .setColor(cat.color)
                            .setTitle(`${cat.emoji} ${cat.name} Commands`)
                            .setDescription(`${commandList}\n\n╰──────────────────────────╯`)
                            .setFooter({
                                text: `📚 ${cat.commands.length} commands • Click Home to go back`,
                                iconURL: interaction.user.displayAvatarURL()
                            })
                            .setTimestamp();

                        await interaction.update({ embeds: [embed] });
                    }
                    return;
                }

                // Info dropdown menu
                if (interaction.customId === 'info_select') {
                    const value = interaction.values[0];
                    let embed;

                    if (value === 'info_roles') {
                        const guild = interaction.guild;
                        const roles = guild.roles.cache
                            .filter(r => r.id !== guild.id && !r.managed)
                            .sort((a, b) => b.position - a.position);

                        const adminRoles = roles.filter(r => r.permissions.has('Administrator'));
                        const modRoles = roles.filter(r =>
                            !r.permissions.has('Administrator') &&
                            (r.permissions.has('ManageMessages') || r.permissions.has('KickMembers'))
                        );
                        const memberRoles = roles.filter(r =>
                            !r.permissions.has('Administrator') &&
                            !r.permissions.has('ManageMessages') &&
                            !r.permissions.has('KickMembers')
                        ).first(10);

                        embed = new EmbedBuilder()
                            .setColor('#5865F2')
                            .setTitle('🛡️ Server Roles')
                            .setDescription(`> Here are the roles on our server:\n\n╭──────────────────────────╮`)
                            .addFields(
                                {
                                    name: '👑 Management',
                                    value: adminRoles.size > 0
                                        ? adminRoles.first(3).map(r => `<@&${r.id}>`).join('\n')
                                        : '`None`',
                                    inline: true
                                },
                                {
                                    name: '🛡️ Staff',
                                    value: modRoles.size > 0
                                        ? modRoles.first(3).map(r => `<@&${r.id}>`).join('\n')
                                        : '`None`',
                                    inline: true
                                },
                                {
                                    name: '👥 Members',
                                    value: memberRoles.size > 0
                                        ? memberRoles.map(r => `<@&${r.id}>`).join('\n')
                                        : '`None`',
                                    inline: true
                                }
                            )
                            .setFooter({
                                text: `${interaction.guild.name} • ${roles.size} total roles`,
                                iconURL: interaction.guild.iconURL({ dynamic: true })
                            })
                            .setTimestamp();
                    } else if (value === 'info_links') {
                        embed = new EmbedBuilder()
                            .setColor('#FF0000')
                            .setTitle('🔗 Official Links')
                            .setDescription(`> Check the links channel for our official links!\n\n> Use \`/setuplinks\` to create a links embed.`)
                            .addFields({
                                name: '📜 Terms of Service',
                                value: '[Discord TOS](https://discord.com/terms)',
                                inline: false
                            })
                            .setFooter({
                                text: `${interaction.guild.name}`,
                                iconURL: interaction.guild.iconURL({ dynamic: true })
                            })
                            .setTimestamp();
                    }

                    if (embed) {
                        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                    }
                    return;
                }
            } catch (error) {
                logger.error('Error handling select menu:', error);
            }
        }

        // Handle modals
        if (interaction.isModalSubmit()) {
            try {
                if (interaction.customId === 'ticket_modal') {
                    const ticketCommand = client.commands.get('ticket');
                    if (ticketCommand && ticketCommand.handleModalSubmit) {
                        await ticketCommand.handleModalSubmit(interaction, client);
                    }
                }

                // Marketplace Modals
                if (interaction.customId.startsWith('modal_mpl_')) {
                    const { handleSubmission } = require('../handlers/marketplaceHandler');
                    await handleSubmission(interaction, client);
                }
            } catch (error) {
                logger.error('Error handling modal:', error);
            }
        }

        // Handle autocomplete
        if (interaction.isAutocomplete()) {
            const command = client.commands.get(interaction.commandName);

            if (!command || !command.autocomplete) return;

            try {
                await command.autocomplete(interaction);
            } catch (error) {
                logger.error('Error handling autocomplete:', error);
            }
        }
    }
};
