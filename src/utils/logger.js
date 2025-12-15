// Simple logger without colors

const getTimestamp = () => {
    return new Date().toLocaleString('tr-TR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
};

const logger = {
    info: (message) => {
        console.log(`[${getTimestamp()}] [INFO] ${message}`);
    },

    success: (message) => {
        console.log(`[${getTimestamp()}] [SUCCESS] ✓ ${message}`);
    },

    warn: (message) => {
        console.log(`[${getTimestamp()}] [WARN] ⚠ ${message}`);
    },

    error: (message, error = null) => {
        console.log(`[${getTimestamp()}] [ERROR] ✗ ${message}`);
        if (error) {
            console.error(error);
        }
    },

    debug: (message) => {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[${getTimestamp()}] [DEBUG] ${message}`);
        }
    },

    command: (user, command, guild) => {
        console.log(`[${getTimestamp()}] [CMD] ${user} used /${command} in ${guild}`);
    },

    database: (message) => {
        console.log(`[${getTimestamp()}] [DB] ${message}`);
    }
};

module.exports = logger;
