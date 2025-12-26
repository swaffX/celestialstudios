// Enhanced Logger with Colors and Structured Output
// Simple logger without external dependencies

const getTimestamp = () => {
    return new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
};

// ANSI color codes for terminal
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m'
};

const colorize = (text, color) => {
    return `${colors[color]}${text}${colors.reset}`;
};

const logger = {
    info: (message) => {
        console.log(`${colorize(`[${getTimestamp()}]`, 'gray')} ${colorize('[INFO]', 'blue')} ${message}`);
    },

    success: (message) => {
        console.log(`${colorize(`[${getTimestamp()}]`, 'gray')} ${colorize('[SUCCESS]', 'green')} ✓ ${message}`);
    },

    warn: (message) => {
        console.log(`${colorize(`[${getTimestamp()}]`, 'gray')} ${colorize('[WARN]', 'yellow')} ⚠ ${message}`);
    },

    error: (message, error = null) => {
        console.log(`${colorize(`[${getTimestamp()}]`, 'gray')} ${colorize('[ERROR]', 'red')} ✗ ${message}`);
        if (error) {
            if (error.stack) {
                console.error(colorize(error.stack, 'dim'));
            } else {
                console.error(error);
            }
        }
    },

    debug: (message) => {
        if (process.env.NODE_ENV === 'development') {
            console.log(`${colorize(`[${getTimestamp()}]`, 'gray')} ${colorize('[DEBUG]', 'magenta')} ${message}`);
        }
    },

    command: (user, command, guild) => {
        console.log(`${colorize(`[${getTimestamp()}]`, 'gray')} ${colorize('[CMD]', 'cyan')} ${colorize(user, 'bright')} used /${colorize(command, 'cyan')} in ${guild}`);
    },

    database: (message) => {
        console.log(`${colorize(`[${getTimestamp()}]`, 'gray')} ${colorize('[DB]', 'magenta')} ${message}`);
    },

    system: (message) => {
        console.log(`${colorize(`[${getTimestamp()}]`, 'gray')} ${colorize('[SYSTEM]', 'blue')} ${message}`);
    },

    rateLimit: (userId, action) => {
        console.log(`${colorize(`[${getTimestamp()}]`, 'gray')} ${colorize('[RATE]', 'yellow')} User ${userId} rate limited on ${action}`);
    }
};

module.exports = logger;
