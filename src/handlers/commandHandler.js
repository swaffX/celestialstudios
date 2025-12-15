const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');
const logger = require('../utils/logger');

module.exports = async (client) => {
    client.commands = new Map();
    const commands = [];

    const commandFolders = fs.readdirSync(path.join(__dirname, '../commands'));

    for (const folder of commandFolders) {
        const folderPath = path.join(__dirname, '../commands', folder);

        // Skip if not a directory
        if (!fs.statSync(folderPath).isDirectory()) continue;

        const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const filePath = path.join(folderPath, file);

            // Clear cache to get updated commands
            delete require.cache[require.resolve(filePath)];

            const command = require(filePath);

            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
                commands.push(command.data.toJSON());
                logger.info(`Loaded command: ${command.data.name}`);
            } else {
                logger.warn(`Command ${file} is missing 'data' or 'execute' property`);
            }
        }
    }

    logger.info(`Total ${commands.length} commands loaded.`);

    // Register slash commands
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    try {
        // FIRST: Clear ALL global commands to remove duplicates
        logger.info('Clearing old global commands...');
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: [] }
        );
        logger.success('Global commands cleared');

        // Register to specific guild for INSTANT updates
        if (process.env.GUILD_ID) {
            await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
                { body: commands }
            );
            logger.success(`Registered ${commands.length} commands to guild (instant update)`);
        } else {
            // If no guild ID, register globally (takes up to 1 hour)
            await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
                { body: commands }
            );
            logger.success(`Registered ${commands.length} global commands`);
        }

    } catch (error) {
        logger.error('Failed to register commands:', error);
    }
};
