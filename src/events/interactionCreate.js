const { Events } = require('discord.js');
const logger = require('../utils/logger');
const embedBuilder = require('../utils/embedBuilder');

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
                    'Hata',
                    'Komut çalıştırılırken bir hata oluştu.'
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
                        content: '❌ Bir hata oluştu!',
                        ephemeral: true
                    });
                }
            }
        }

        // Handle select menus
        if (interaction.isStringSelectMenu()) {
            try {
                // Handle any select menu interactions here
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
