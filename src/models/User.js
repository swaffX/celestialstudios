const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    odasi: { type: String, required: true }, // odasi ID
    odaId: { type: String, required: true }, // Guild ID

    // Leveling
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 0 },
    totalXp: { type: Number, default: 0 },

    // Activity Stats
    totalMessages: { type: Number, default: 0 },
    voiceTime: { type: Number, default: 0 }, // Minutes

    // Daily Tracking
    dailyXp: { type: Number, default: 0 },
    dailyReset: { type: Date, default: Date.now },
    lastMessageTime: { type: Date, default: null },

    // Streak System
    lastActiveDate: { type: Date, default: null },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },

    // Achievements & Badges
    achievements: [{ type: String }],
    badges: [{ type: String }],

    // Giveaways
    giveawaysEntered: { type: Number, default: 0 },
    giveawaysWon: { type: Number, default: 0 },

    // Moderation
    warnings: [{
        reason: { type: String, required: true },
        moderatorId: { type: String, required: true },
        moderatorTag: { type: String, required: true },
        date: { type: Date, default: Date.now }
    }],

    // Invite System
    invites: { type: Number, default: 0 },           // Successful invites
    invitedBy: { type: String, default: null },      // Who invited this user
    inviteCode: { type: String, default: null },     // Which invite code was used
    fakeInvites: { type: Number, default: 0 },       // Left after joining
    bonusInvites: { type: Number, default: 0 },      // Bonus invites given by admin

    // Timestamps
    joinedAt: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Compound index for faster queries
userSchema.index({ odasi: 1, odaId: 1 }, { unique: true });
userSchema.index({ odaId: 1, xp: -1 }); // For leaderboard queries

// Static method to find or create user
userSchema.statics.findOrCreate = async function (odasi, odaId) {
    let user = await this.findOne({ odasi, odaId });
    if (!user) {
        user = await this.create({ odasi, odaId });
    }
    return user;
};

// Method to add XP with daily limit check
userSchema.methods.addXp = async function (amount, config) {
    const now = new Date();
    const resetTime = new Date(this.dailyReset);

    // Reset daily XP if new day
    if (now.toDateString() !== resetTime.toDateString()) {
        this.dailyXp = 0;
        this.dailyReset = now;

        // Update streak
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);

        if (this.lastActiveDate &&
            this.lastActiveDate.toDateString() === yesterday.toDateString()) {
            this.currentStreak++;
            if (this.currentStreak > this.longestStreak) {
                this.longestStreak = this.currentStreak;
            }
        } else if (!this.lastActiveDate ||
            this.lastActiveDate.toDateString() !== now.toDateString()) {
            this.currentStreak = 1;
        }
        this.lastActiveDate = now;
    }

    // Check daily limit
    const remainingDaily = config.leveling.dailyXpLimit - this.dailyXp;
    const actualXp = Math.min(amount, remainingDaily);

    if (actualXp <= 0) return { leveledUp: false, actualXp: 0 };

    this.xp += actualXp;
    this.totalXp += actualXp;
    this.dailyXp += actualXp;

    // Check level up
    let leveledUp = false;
    let newLevel = this.level;

    while (this.xp >= config.leveling.levelUpFormula(this.level + 1)) {
        this.xp -= config.leveling.levelUpFormula(this.level + 1);
        this.level++;
        leveledUp = true;
        newLevel = this.level;
    }

    this.lastSeen = now;
    await this.save();

    return { leveledUp, newLevel, actualXp };
};

module.exports = mongoose.model('User', userSchema);
