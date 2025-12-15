require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const mongoose = require('mongoose');
const logger = require('./utils/logger');
const commandHandler = require('./handlers/commandHandler');
const eventHandler = require('./handlers/eventHandler');
const GiveawayHandler = require('./handlers/giveawayHandler');

// Import Systems
const { initBoosterSystem } = require('./systems/boosterSystem');
const { initServerStats } = require('./systems/serverStatsSystem');
const { initStatsEmbed } = require('./systems/statsEmbedSystem');

// Create Discord client with all necessary intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildPresences // For boost detection
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
        Partials.User,
        Partials.GuildMember
    ]
});

// Collections
client.commands = new Collection();
client.cooldowns = new Collection();
client.voiceStates = new Map(); // Track voice channel join times

// Initialize giveaway handler
client.giveawayHandler = new GiveawayHandler(client);

// Store system initializers
client.initSystems = async () => {
    await initBoosterSystem(client);
    await initServerStats(client);
    await initStatsEmbed(client);
};

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        logger.success('Connected to MongoDB');
    })
    .catch((error) => {
        logger.error('MongoDB connection error:', error);
        process.exit(1);
    });

// Handle MongoDB events
mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
    logger.success('MongoDB reconnected');
});

// Load handlers
(async () => {
    try {
        await commandHandler(client);
        await eventHandler(client);

        // Login to Discord
        await client.login(process.env.DISCORD_TOKEN);

    } catch (error) {
        logger.error('Failed to start bot:', error);
        process.exit(1);
    }
})();

// Handle process errors
process.on('unhandledRejection', (error) => {
    logger.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', error);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    logger.info('Shutting down...');
    client.giveawayHandler.stop();
    await mongoose.connection.close();
    client.destroy();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    logger.info('Shutting down...');
    client.giveawayHandler.stop();
    await mongoose.connection.close();
    client.destroy();
    process.exit(0);
});
