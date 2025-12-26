/**
 * Rate Limiting Middleware
 * Provides in-memory rate limiting for Discord interactions
 */

const rateLimits = new Map();

/**
 * Check if an action is rate limited
 * @param {string} userId - User ID
 * @param {string} action - Action identifier (e.g., 'giveaway_enter', 'button_click')
 * @param {number} cooldownMs - Cooldown in milliseconds (default: 3000)
 * @returns {object} - { allowed: boolean, remainingMs: number }
 */
function checkRateLimit(userId, action, cooldownMs = 3000) {
    const key = `${userId}-${action}`;
    const now = Date.now();
    const lastAction = rateLimits.get(key);

    if (lastAction && now - lastAction < cooldownMs) {
        return {
            allowed: false,
            remainingMs: cooldownMs - (now - lastAction)
        };
    }

    rateLimits.set(key, now);
    return { allowed: true, remainingMs: 0 };
}

/**
 * Get formatted cooldown message
 * @param {number} remainingMs - Remaining milliseconds
 * @returns {string} - Formatted message
 */
function getCooldownMessage(remainingMs) {
    const seconds = Math.ceil(remainingMs / 1000);
    return `⏳ Please wait **${seconds}** second${seconds !== 1 ? 's' : ''} before doing this again.`;
}

/**
 * Clear rate limits for a specific user or all
 * @param {string} userId - Optional user ID to clear
 */
function clearRateLimits(userId = null) {
    if (userId) {
        // Clear all entries for a specific user
        for (const key of rateLimits.keys()) {
            if (key.startsWith(userId)) {
                rateLimits.delete(key);
            }
        }
    } else {
        rateLimits.clear();
    }
}

/**
 * Clean up old rate limit entries (call periodically)
 * @param {number} maxAgeMs - Maximum age in milliseconds (default: 5 minutes)
 */
function cleanupRateLimits(maxAgeMs = 300000) {
    const now = Date.now();
    for (const [key, timestamp] of rateLimits.entries()) {
        if (now - timestamp > maxAgeMs) {
            rateLimits.delete(key);
        }
    }
}

// Auto-cleanup every 5 minutes
setInterval(() => cleanupRateLimits(), 300000);

// Rate limit configurations
const RATE_LIMITS = {
    GIVEAWAY_ENTRY: 5000,      // 5 seconds between giveaway entries
    BUTTON_CLICK: 2000,         // 2 seconds between button clicks
    COMMAND: 3000,              // 3 seconds between commands
    TICKET_CREATE: 60000,       // 1 minute between ticket creations
    SUGGESTION: 30000,          // 30 seconds between suggestions
    APPLICATION: 300000         // 5 minutes between applications
};

module.exports = {
    checkRateLimit,
    getCooldownMessage,
    clearRateLimits,
    cleanupRateLimits,
    RATE_LIMITS
};
