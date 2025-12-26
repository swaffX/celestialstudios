/**
 * Constants and Configuration Values
 * Centralized file for all hardcoded values
 */

// Banner URLs
const BANNERS = {
    HELP: 'https://cdn.discordapp.com/attachments/1447262708440236084/1450284176564818063/Gemini_Generated_Image_eyxkuceyxkuceyxk.png',
    WELCOME: 'https://cdn.discordapp.com/attachments/531892263652032522/1450318087948603486/Gemini_Generated_Image_mhflenmhflenmhfl.png',
    FAREWELL: 'https://cdn.discordapp.com/attachments/531892263652032522/1450318352022114535/Gemini_Generated_Image_pkcjdjpkcjdjpkcj.png'
};

// Embed Colors (as hex integers)
const COLORS = {
    PRIMARY: 0x5865F2,      // Discord Blurple
    SUCCESS: 0x22c55e,      // Green
    ERROR: 0xef4444,        // Red
    WARNING: 0xf59e0b,      // Orange
    INFO: 0x3498db,         // Blue
    PURPLE: 0x9b59b6,       // Purple
    GIVEAWAY: 0x7c3aed,     // Violet
    MODERATION: 0xe74c3c,   // Red
    LEVELING: 0x3498db,     // Blue
    TICKET: 0x1abc9c        // Teal
};

// Default Messages
const MESSAGES = {
    WELCOME: 'Welcome {user}! 🎉 Thanks for joining our server.',
    FAREWELL: '{user} has left the server. Goodbye! 👋',
    LEVEL_UP: 'Congratulations {user}! 🎊 You reached **Level {level}**!',
    GIVEAWAY_ENTRY: '✅ You entered the giveaway!',
    GIVEAWAY_EXIT: '✅ You left the giveaway!',
    GIVEAWAY_WIN: '🎉 Congratulations! You won **{prize}**!',
    TICKET_CREATED: '✅ Ticket created!',
    TICKET_CLOSED: '🔒 Ticket closed.'
};

// Emoji Sets
const EMOJIS = {
    MEDALS: ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'],
    SUCCESS: '✅',
    ERROR: '❌',
    WARNING: '⚠️',
    INFO: 'ℹ️',
    LOADING: '⏳',
    GIVEAWAY: '🎉',
    TICKET: '🎫',
    LEVEL: '📊',
    XP: '⭐',
    VOICE: '🎤',
    MESSAGE: '💬',
    INVITE: '📨'
};

// Limits
const LIMITS = {
    MAX_EMBED_DESCRIPTION: 4096,
    MAX_EMBED_FIELDS: 25,
    MAX_FIELD_VALUE: 1024,
    MAX_GIVEAWAY_WINNERS: 10,
    MAX_WARNINGS_DISPLAY: 10,
    MAX_LEADERBOARD_ENTRIES: 10,
    MAX_ROLES_DISPLAY: 10
};

// Time Constants (in milliseconds)
const TIMES = {
    SECOND: 1000,
    MINUTE: 60000,
    HOUR: 3600000,
    DAY: 86400000,
    WEEK: 604800000,
    MONTH: 2592000000
};

module.exports = {
    BANNERS,
    COLORS,
    MESSAGES,
    EMOJIS,
    LIMITS,
    TIMES
};
