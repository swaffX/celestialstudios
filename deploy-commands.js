require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandsPath = path.join(__dirname, 'src', 'commands');

// Recursively get all command files
function getCommandFiles(dir) {
    const files = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
        const fullPath = path.join(dir, item);
        if (fs.statSync(fullPath).isDirectory()) {
            files.push(...getCommandFiles(fullPath));
        } else if (item.endsWith('.js')) {
            files.push(fullPath);
        }
    }
    return files;
}

// Load all commands
const commandFiles = getCommandFiles(commandsPath);

for (const file of commandFiles) {
    const command = require(file);
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
        console.log(`✅ Loaded: ${command.data.name}`);
    }
}

console.log(`\n📦 Total commands: ${commands.length}`);

// Deploy commands
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('\n🔄 Clearing old commands...');

        // Clear global commands first
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: [] }
        );
        console.log('✅ Cleared global commands');

        console.log('\n🚀 Registering commands...');

        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );

        console.log(`\n✅ Successfully registered ${data.length} commands!`);

        // List registered commands
        console.log('\n📋 Registered commands:');
        data.forEach(cmd => {
            console.log(`   - /${cmd.name}: ${cmd.description}`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    }
})();
