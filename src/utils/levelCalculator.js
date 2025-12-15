const config = require('../config');

const levelCalculator = {
    /**
     * Get XP required for next level
     * @param {number} level - Current level
     * @returns {number} - XP required
     */
    getRequiredXP(level) {
        return config.leveling.levelUpFormula(level);
    },

    /**
     * Calculate total XP needed to reach a level from 0
     * @param {number} targetLevel - Target level
     * @returns {number} - Total XP needed
     */
    getTotalXPForLevel(targetLevel) {
        let total = 0;
        for (let i = 1; i <= targetLevel; i++) {
            total += this.getRequiredXP(i);
        }
        return total;
    },

    /**
     * Generate random XP within configured range
     * @returns {number} - Random XP amount
     */
    getRandomXP() {
        const { min, max } = config.leveling.xpPerMessage;
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * Check if user can earn XP (cooldown check)
     * @param {Date|null} lastMessageTime - Last message timestamp
     * @returns {boolean} - Can earn XP
     */
    canEarnXP(lastMessageTime) {
        if (!lastMessageTime) return true;
        const now = Date.now();
        const cooldown = config.leveling.xpCooldown;
        return (now - new Date(lastMessageTime).getTime()) >= cooldown;
    },

    /**
     * Calculate level from total XP
     * @param {number} totalXP - Total XP amount
     * @returns {Object} - Level and remaining XP
     */
    calculateLevel(totalXP) {
        let level = 0;
        let remainingXP = totalXP;

        while (remainingXP >= this.getRequiredXP(level + 1)) {
            remainingXP -= this.getRequiredXP(level + 1);
            level++;
        }

        return { level, xp: remainingXP };
    },

    /**
     * Get progress percentage to next level
     * @param {number} currentXP - Current XP
     * @param {number} level - Current level
     * @returns {number} - Progress percentage (0-100)
     */
    getProgress(currentXP, level) {
        const required = this.getRequiredXP(level + 1);
        return Math.floor((currentXP / required) * 100);
    },

    /**
     * Format XP number with K, M suffix
     * @param {number} xp - XP amount
     * @returns {string} - Formatted XP string
     */
    formatXP(xp) {
        if (xp >= 1000000) {
            return (xp / 1000000).toFixed(1) + 'M';
        } else if (xp >= 1000) {
            return (xp / 1000).toFixed(1) + 'K';
        }
        return xp.toString();
    },

    /**
     * Create progress bar visual
     * @param {number} current - Current value
     * @param {number} max - Max value
     * @param {number} length - Bar length
     * @returns {string} - Progress bar string
     */
    createProgressBar(current, max, length = 10) {
        const progress = Math.floor((current / max) * length);
        const empty = length - progress;

        const filled = '█'.repeat(progress);
        const unfilled = '░'.repeat(empty);

        return `${filled}${unfilled}`;
    }
};

module.exports = levelCalculator;
