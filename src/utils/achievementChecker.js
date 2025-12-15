const config = require('../config');
const User = require('../models/User');
const logger = require('./logger');

const achievementChecker = {
    /**
     * Check and unlock achievements for a user
     * @param {Object} userData - User document from database
     * @param {Object} client - Discord client
     * @param {Object} member - Guild member
     * @returns {Array} - List of newly unlocked achievements
     */
    async check(userData, client, member) {
        const unlockedAchievements = [];

        for (const achievement of config.achievements) {
            // Skip if already unlocked
            if (userData.achievements.includes(achievement.id)) continue;

            let unlocked = false;

            switch (achievement.requirement.type) {
                case 'messages':
                    unlocked = userData.totalMessages >= achievement.requirement.value;
                    break;

                case 'level':
                    unlocked = userData.level >= achievement.requirement.value;
                    break;

                case 'voiceTime':
                    unlocked = userData.voiceTime >= achievement.requirement.value;
                    break;

                case 'streak':
                    unlocked = userData.currentStreak >= achievement.requirement.value;
                    break;

                case 'giveawaysWon':
                    unlocked = userData.giveawaysWon >= achievement.requirement.value;
                    break;

                case 'badges':
                    unlocked = userData.badges.length >= achievement.requirement.value;
                    break;

                case 'invites':
                    const totalInvites = (userData.invites || 0) + (userData.bonusInvites || 0);
                    unlocked = totalInvites >= achievement.requirement.value;
                    break;
            }

            if (unlocked) {
                userData.achievements.push(achievement.id);
                userData.badges.push(achievement.badge);

                // Add XP reward if any
                if (achievement.xpReward > 0) {
                    userData.xp += achievement.xpReward;
                    userData.totalXp += achievement.xpReward;
                }

                unlockedAchievements.push(achievement);
                logger.info(`${member.user.tag} unlocked achievement: ${achievement.name}`);
            }
        }

        if (unlockedAchievements.length > 0) {
            await userData.save();
        }

        return unlockedAchievements;
    },

    /**
     * Get achievement by ID
     * @param {string} id - Achievement ID
     * @returns {Object|null} - Achievement object or null
     */
    getById(id) {
        return config.achievements.find(a => a.id === id) || null;
    },

    /**
     * Get all achievements with user progress
     * @param {Object} userData - User document
     * @returns {Array} - Achievements with unlock status
     */
    getProgress(userData) {
        return config.achievements.map(achievement => {
            const unlocked = userData.achievements.includes(achievement.id);
            let progress = 0;
            let current = 0;

            switch (achievement.requirement.type) {
                case 'messages':
                    current = userData.totalMessages;
                    break;
                case 'level':
                    current = userData.level;
                    break;
                case 'voiceTime':
                    current = userData.voiceTime;
                    break;
                case 'streak':
                    current = userData.currentStreak;
                    break;
                case 'giveawaysWon':
                    current = userData.giveawaysWon;
                    break;
                case 'badges':
                    current = userData.badges.length;
                    break;
                case 'invites':
                    current = (userData.invites || 0) + (userData.bonusInvites || 0);
                    break;
            }

            progress = Math.min(100, Math.floor((current / achievement.requirement.value) * 100));

            return {
                ...achievement,
                unlocked,
                progress,
                current,
                required: achievement.requirement.value
            };
        });
    }
};

module.exports = achievementChecker;
