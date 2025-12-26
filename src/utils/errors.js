/**
 * Custom Error Classes
 * Structured error types for better error handling
 */

/**
 * Base error class for the bot
 */
class BotError extends Error {
    constructor(message, code = 'BOT_ERROR') {
        super(message);
        this.name = 'BotError';
        this.code = code;
        this.timestamp = new Date();
    }

    toJSON() {
        return {
            name: this.name,
            code: this.code,
            message: this.message,
            timestamp: this.timestamp
        };
    }
}

/**
 * Database-related errors
 */
class DatabaseError extends BotError {
    constructor(message, operation = 'unknown') {
        super(message, 'DATABASE_ERROR');
        this.name = 'DatabaseError';
        this.operation = operation;
    }
}

/**
 * Discord API errors
 */
class DiscordError extends BotError {
    constructor(message, discordCode = null) {
        super(message, 'DISCORD_ERROR');
        this.name = 'DiscordError';
        this.discordCode = discordCode;
    }
}

/**
 * Validation errors
 */
class ValidationError extends BotError {
    constructor(message, field = null) {
        super(message, 'VALIDATION_ERROR');
        this.name = 'ValidationError';
        this.field = field;
    }
}

/**
 * Rate limit errors
 */
class RateLimitError extends BotError {
    constructor(message, remainingMs = 0) {
        super(message, 'RATE_LIMIT_ERROR');
        this.name = 'RateLimitError';
        this.remainingMs = remainingMs;
    }
}

/**
 * Permission errors
 */
class PermissionError extends BotError {
    constructor(message, requiredPermission = null) {
        super(message, 'PERMISSION_ERROR');
        this.name = 'PermissionError';
        this.requiredPermission = requiredPermission;
    }
}

/**
 * Configuration errors
 */
class ConfigurationError extends BotError {
    constructor(message, configKey = null) {
        super(message, 'CONFIGURATION_ERROR');
        this.name = 'ConfigurationError';
        this.configKey = configKey;
    }
}

module.exports = {
    BotError,
    DatabaseError,
    DiscordError,
    ValidationError,
    RateLimitError,
    PermissionError,
    ConfigurationError
};
