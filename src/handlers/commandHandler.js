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

    // Register slash commands
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    try {
        logger.info(`Registering ${commands.length} slash commands...`);

        // Register to test guild first for faster updates
        if (process.env.TEST_GUILD_ID) {
            await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.TEST_GUILD_ID),
                { body: commands }
            );
            logger.success(`Registered commands to test guild`);
        }

        // Also register globally
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );
        logger.success(`Registered ${commands.length} global commands`);

    } catch (error) {
        logger.error('Failed to register commands:', error);
    }
};
