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
        GatewayIntentBits.GuildPresences
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
        Partials.User,
        Partials.GuildMember
    ],
    rest: {
        timeout: 60000, // 60s request timeout
        retries: 5,
    }
});

// Collections
client.commands = new Collection();
client.cooldowns = new Collection();
client.voiceStates = new Map();

// Initialize giveaway handler
client.giveawayHandler = new GiveawayHandler(client);

// Store system initializers
client.initSystems = async () => {
    await initBoosterSystem(client);
    await initServerStats(client);
    await initStatsEmbed(client);
};

// MongoDB Connection with retry logic
const connectDB = async (retries = 5) => {
    for (let i = 0; i < retries; i++) {
        try {
            await mongoose.connect(process.env.MONGODB_URI, {
                serverSelectionTimeoutMS: 30000,
                socketTimeoutMS: 45000,
                maxPoolSize: 10,
                bufferCommands: false
            });
            logger.success('Connected to MongoDB');
            return true;
        } catch (error) {
            logger.error(`MongoDB connection attempt ${i + 1}/${retries} failed:`, error.message);
            if (i < retries - 1) {
                logger.info(`Retrying in 5 seconds...`);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }
    return false;
};

// Handle MongoDB events
mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
    logger.success('MongoDB reconnected');
});

mongoose.connection.on('error', (err) => {
    logger.error('MongoDB error:', err.message);
});

// Load handlers and start bot
(async () => {
    try {
        // Connect to MongoDB first
        const dbConnected = await connectDB();
        if (!dbConnected) {
            logger.error('Could not connect to MongoDB after multiple retries. Exiting...');
            process.exit(1);
        }

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
