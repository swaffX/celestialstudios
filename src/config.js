module.exports = {
    // Bot Settings
    embedColor: parseInt('7c3aed', 16),
    successColor: parseInt('22c55e', 16),
    errorColor: parseInt('ef4444', 16),
    warningColor: parseInt('f59e0b', 16),

    // Level System Settings
    leveling: {
        xpPerMessage: { min: 15, max: 25 },
        xpCooldown: 60000, // 60 seconds in ms
        dailyXpLimit: 1000,
        voiceXpPerMinute: 2,
        voiceMaxMinutesPerHour: 30,
        levelUpFormula: (level) => Math.floor(100 * Math.pow(level, 1.8))
    },

    // Giveaway Settings
    giveaway: {
        minDuration: 60000, // 1 minute
        maxDuration: 2592000000, // 30 days
        maxWinners: 10,
        emoji: '🎉'
    },

    // Achievement Definitions
    achievements: [
        {
            id: 'first_message',
            name: '🌟 First Steps',
            description: 'Send your first message',
            requirement: { type: 'messages', value: 1 },
            badge: 'Newcomer',
            xpReward: 50
        },
        {
            id: 'chatter_100',
            name: '💬 Chatter',
            description: 'Send 100 messages',
            requirement: { type: 'messages', value: 100 },
            badge: 'Active Member',
            xpReward: 200
        },
        {
            id: 'chatter_500',
            name: '🗣️ Talkative',
            description: 'Send 500 messages',
            requirement: { type: 'messages', value: 500 },
            badge: 'Talkative',
            xpReward: 500
        },
        {
            id: 'veteran_1000',
            name: '📢 Veteran',
            description: 'Send 1000 messages',
            requirement: { type: 'messages', value: 1000 },
            badge: 'Veteran',
            xpReward: 1000
        },
        {
            id: 'voice_master',
            name: '🎤 Voice Master',
            description: 'Spend 10 hours in voice channels',
            requirement: { type: 'voiceTime', value: 600 }, // 600 minutes = 10 hours
            badge: 'Voice Master',
            xpReward: 500
        },
        {
            id: 'weekly_active',
            name: '📅 Weekly Warrior',
            description: 'Be active for 7 days in a row',
            requirement: { type: 'streak', value: 7 },
            badge: 'Loyal Member',
            xpReward: 300
        },
        {
            id: 'level_10',
            name: '🏅 Experienced',
            description: 'Reach Level 10',
            requirement: { type: 'level', value: 10 },
            badge: 'Experienced',
            xpReward: 0
        },
        {
            id: 'level_25',
            name: '👑 Elite',
            description: 'Reach Level 25',
            requirement: { type: 'level', value: 25 },
            badge: 'Elite',
            xpReward: 0
        },
        {
            id: 'level_50',
            name: '🎖️ Legendary',
            description: 'Reach Level 50',
            requirement: { type: 'level', value: 50 },
            badge: 'Legendary',
            xpReward: 0
        },
        {
            id: 'lucky_winner',
            name: '🎁 Lucky',
            description: 'Win a giveaway',
            requirement: { type: 'giveawaysWon', value: 1 },
            badge: 'Lucky',
            xpReward: 100
        },
        {
            id: 'giveaway_king',
            name: '🎊 Giveaway King',
            description: 'Win 5 giveaways',
            requirement: { type: 'giveawaysWon', value: 5 },
            badge: 'Giveaway King',
            xpReward: 500
        },
        {
            id: 'collector',
            name: '🌈 Collector',
            description: 'Collect 10 badges',
            requirement: { type: 'badges', value: 10 },
            badge: 'Collector',
            xpReward: 1000
        },
        // Invite Achievements
        {
            id: 'inviter_5',
            name: '📨 Inviter',
            description: 'Invite 5 people',
            requirement: { type: 'invites', value: 5 },
            badge: 'Inviter',
            xpReward: 250
        },
        {
            id: 'inviter_10',
            name: '📬 Popular',
            description: 'Invite 10 people',
            requirement: { type: 'invites', value: 10 },
            badge: 'Popular',
            xpReward: 500
        },
        {
            id: 'inviter_25',
            name: '🌟 Influencer',
            description: 'Invite 25 people',
            requirement: { type: 'invites', value: 25 },
            badge: 'Influencer',
            xpReward: 1000
        },
        {
            id: 'inviter_50',
            name: '👑 Invite King',
            description: 'Invite 50 people',
            requirement: { type: 'invites', value: 50 },
            badge: 'Invite King',
            xpReward: 2500
        }
    ],

    // Invite System Settings
    invites: {
        xpPerInvite: 100, // XP reward per successful invite
        fakeInvitePenalty: true, // Remove invite if user leaves
        minAccountAge: 1, // Minimum days for invite to count
        specialGiveawayMinInvites: 10 // Min invites for special giveaway access
    },

    // Ticket Settings
    ticket: {
        categoryName: 'Tickets',
        transcriptChannelName: 'ticket-logs'
    }
};
