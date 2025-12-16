const mongoose = require('mongoose');

const giveawaySchema = new mongoose.Schema({
    messageId: { type: String, required: true, unique: true },
    channelId: { type: String, required: true },
    guildId: { type: String, required: true },

    // Giveaway Details
    prize: { type: String, required: true },
    description: { type: String, default: '' },
    hostId: { type: String, required: true },
    hostTag: { type: String, required: true },

    // Winners
    winnersCount: { type: Number, default: 1, min: 1, max: 10 },
    winnerIds: [{ type: String }],

    // Timing
    startedAt: { type: Date, default: Date.now },
    endsAt: { type: Date, required: true },
    ended: { type: Boolean, default: false },
    bannerUrl: { type: String, default: null },

    // Entries
    entries: [{ type: String }], // User IDs

    // Requirements
    requirements: {
        requiredRoles: [{ type: String }],
        minLevel: { type: Number, default: 0 },
        minMessages: { type: Number, default: 0 },
        minAccountAge: { type: Number, default: 0 }, // Days
        minServerAge: { type: Number, default: 0 }, // Days in server
        minInvites: { type: Number, default: 0 } // Minimum invites for special giveaways
    },

    // Extra settings
    bonusEntries: [{
        roleId: { type: String },
        entries: { type: Number }
    }]
}, {
    timestamps: true
});

// Index for finding active giveaways
giveawaySchema.index({ guildId: 1, ended: 1 });
giveawaySchema.index({ endsAt: 1, ended: 1 });

// Method to check if user meets requirements
giveawaySchema.methods.checkRequirements = async function (member, userData) {
    const req = this.requirements;
    const now = new Date();

    // Check roles
    if (req.requiredRoles && req.requiredRoles.length > 0) {
        const hasRole = req.requiredRoles.some(roleId => member.roles.cache.has(roleId));
        if (!hasRole) {
            return { eligible: false, reason: 'Gerekli role sahip değilsin.' };
        }
    }

    // Check level
    if (req.minLevel > 0 && (!userData || userData.level < req.minLevel)) {
        return {
            eligible: false,
            reason: `Minimum seviye ${req.minLevel} gerekli. Seviyen: ${userData?.level || 0}`
        };
    }

    // Check messages
    if (req.minMessages > 0 && (!userData || userData.totalMessages < req.minMessages)) {
        return {
            eligible: false,
            reason: `Minimum ${req.minMessages} mesaj gerekli. Mesajların: ${userData?.totalMessages || 0}`
        };
    }

    // Check account age
    if (req.minAccountAge > 0) {
        const accountAge = Math.floor((now - member.user.createdAt) / (1000 * 60 * 60 * 24));
        if (accountAge < req.minAccountAge) {
            return {
                eligible: false,
                reason: `Hesabın en az ${req.minAccountAge} günlük olmalı. Hesap yaşı: ${accountAge} gün`
            };
        }
    }

    // Check server age
    if (req.minServerAge > 0) {
        const serverAge = Math.floor((now - member.joinedAt) / (1000 * 60 * 60 * 24));
        if (serverAge < req.minServerAge) {
            return {
                eligible: false,
                reason: `Sunucuda en az ${req.minServerAge} gün olmalısın. Sunucuda: ${serverAge} gün`
            };
        }
    }

    // Check minimum invites (for special giveaways)
    if (req.minInvites > 0) {
        const totalInvites = (userData?.invites || 0) + (userData?.bonusInvites || 0);
        if (totalInvites < req.minInvites) {
            return {
                eligible: false,
                reason: `Minimum ${req.minInvites} davet gerekli (Özel Çekiliş). Davetlerin: ${totalInvites}`
            };
        }
    }

    return { eligible: true };
};

// Method to select winners
giveawaySchema.methods.selectWinners = function () {
    if (this.entries.length === 0) return [];

    const winners = [];
    const entries = [...this.entries];
    const count = Math.min(this.winnersCount, entries.length);

    for (let i = 0; i < count; i++) {
        const winnerIndex = Math.floor(Math.random() * entries.length);
        winners.push(entries[winnerIndex]);
        entries.splice(winnerIndex, 1);
    }

    return winners;
};

module.exports = mongoose.model('Giveaway', giveawaySchema);
