const { Events, EmbedBuilder } = require('discord.js');
const logger = require('../utils/logger');
const embedBuilder = require('../utils/embedBuilder');
const { handleStatsButton } = require('../systems/statsEmbedSystem');
const config = require('../config');

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
                    await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
                } else {
                    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
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

                // Reaction role buttons (role_ROLEID)
                if (interaction.customId.startsWith('role_')) {
                    const roleId = interaction.customId.replace('role_', '');
                    const role = interaction.guild.roles.cache.get(roleId);

                    if (!role) {
                        return interaction.reply({ content: '❌ Role not found!', ephemeral: true });
                    }

                    const member = interaction.member;

                    if (member.roles.cache.has(roleId)) {
                        await member.roles.remove(roleId);
                        await interaction.reply({
                            content: `✅ Removed **${role.name}** role!`,
                            ephemeral: true
                        });
                    } else {
                        await member.roles.add(roleId);
                        await interaction.reply({
                            content: `✅ Added **${role.name}** role!`,
                            ephemeral: true
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

            } catch (error) {
                logger.error('Error handling button interaction:', error);

                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: '❌ An error occurred!',
                        ephemeral: true
                    });
                }
            }
        }

        // Handle select menus
        if (interaction.isStringSelectMenu()) {
            try {
                // Info dropdown menu
                if (interaction.customId === 'info_select') {
                    const value = interaction.values[0];

                    let embed;

                    if (value === 'info_roles') {
                        embed = new EmbedBuilder()
                            .setColor('#2B2D31')
                            .setTitle('🎭 Server Roles')
                            .setDescription(
                                `**Staff Roles**\n` +
                                `> 👑 **Owner** - Server owner\n` +
                                `> ⚔️ **Admin** - Full permissions\n` +
                                `> 🛡️ **Moderator** - Moderation access\n\n` +
                                `**Special Roles**\n` +
                                `> 💎 **Booster** - Server boosters\n` +
                                `> 📹 **Content Creator** - Verified creators\n` +
                                `> 🏆 **VIP** - Special members\n\n` +
                                `**Level Roles**\n` +
                                `> Earn XP by chatting and being active!`
                            )
                            .setFooter({ text: 'Roles are earned through activity and contributions!' });
                    } else if (value === 'info_links') {
                        embed = new EmbedBuilder()
                            .setColor('#2B2D31')
                            .setTitle('🔗 Official Links')
                            .setDescription(
                                `**🎮 Roblox**\n` +
                                `> [Play Our Game](${config.links?.robloxGame || 'https://roblox.com'})\n` +
                                `> [Join Our Group](${config.links?.robloxGroup || 'https://roblox.com/groups'})\n\n` +
                                `**📱 Social Media**\n` +
                                `> Follow us for updates and announcements!`
                            )
                            .setFooter({ text: 'Stay connected!' });
                    } else if (value === 'info_cc') {
                        embed = new EmbedBuilder()
                            .setColor('#2B2D31')
                            .setTitle('📹 Content Creator Program')
                            .setDescription(
                                `**Requirements:**\n` +
                                `> 📊 Minimum 1,000 subscribers/followers\n` +
                                `> 🎥 Regular content about our game\n` +
                                `> 🎯 Active community presence\n\n` +
                                `**Benefits:**\n` +
                                `> 🏷️ Exclusive CC role\n` +
                                `> 📢 Content promotion\n` +
                                `> 🎁 Early access to updates\n\n` +
                                `*Open a ticket to apply!*`
                            )
                            .setFooter({ text: 'We love our content creators!' });
                    }

                    if (embed) {
                        await interaction.reply({ embeds: [embed], ephemeral: true });
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
                // Handle modal submissions here
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
