const mongoose = require('mongoose');

const guildSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },

    // Channel Settings
    levelChannel: { type: String, default: null },
    welcomeChannel: { type: String, default: null },
    farewellChannel: { type: String, default: null },
    modLogChannel: { type: String, default: null },
    giveawayChannel: { type: String, default: null },

    // Ticket Settings
    ticketCategory: { type: String, default: null },
    ticketLogChannel: { type: String, default: null },
    ticketCounter: { type: Number, default: 0 },
    ticketPanelMessage: { type: String, default: null },
    ticketPanelChannel: { type: String, default: null },

    // Role Settings
    autoRoles: [{ type: String }],
    levelRoles: [{
        level: { type: Number, required: true },
        roleId: { type: String, required: true }
    }],
    modRoles: [{ type: String }],
    ticketSupportRoles: [{ type: String }],

    // Messages (English)
    welcomeMessage: {
        type: String,
        default: 'Welcome {user}! 🎉 Thanks for joining our server.'
    },
    farewellMessage: {
        type: String,
        default: '{user} has left the server. Goodbye! 👋'
    },
    levelUpMessage: {
        type: String,
        default: 'Congratulations {user}! 🎊 You reached **Level {level}**!'
    },

    // Features Toggle
    features: {
        leveling: { type: Boolean, default: true },
        welcome: { type: Boolean, default: true },
        farewell: { type: Boolean, default: true },
        moderation: { type: Boolean, default: true },
        tickets: { type: Boolean, default: true },
        giveaways: { type: Boolean, default: true }
    },

    // Booster System
    boosterSystem: {
        enabled: { type: Boolean, default: false },
        channelId: { type: String, default: null },
        messageId: { type: String, default: null },
        bannerUrl: { type: String, default: null }
    },

    // Server Stats System (Voice channel counters)
    serverStats: {
        enabled: { type: Boolean, default: false },
        channelIds: {
            categoryId: { type: String, default: null },
            allMembers: { type: String, default: null },
            members: { type: String, default: null },
            bots: { type: String, default: null }
        }
    },

    // Stats Embed System (Leaderboard display)
    statsEmbed: {
        enabled: { type: Boolean, default: false },
        channelId: { type: String, default: null },
        messageId: { type: String, default: null },
        period: { type: String, default: 'weekly' }
    },

    // Reaction Roles (Button-based)
    reactionRoles: {
        messageId: { type: String, default: null },
        channelId: { type: String, default: null },
        roles: {
            announcements: { type: String, default: null },
            updates: { type: String, default: null },
            sneak_peeks: { type: String, default: null },
            giveaways: { type: String, default: null },
            events: { type: String, default: null }
        }
    },

    // Logging System
    logs: {
        enabled: { type: Boolean, default: false },
        categoryId: { type: String, default: null },
        channels: {
            message: { type: String, default: null },
            member: { type: String, default: null },
            mod: { type: String, default: null },
            role: { type: String, default: null },
            channel: { type: String, default: null },
            voice: { type: String, default: null },
            server: { type: String, default: null }
        }
    },

    // Welcome System
    welcomeSystem: {
        enabled: { type: Boolean, default: false },
        welcomeChannelId: { type: String, default: null },
        farewellChannelId: { type: String, default: null },
        invitesChannelId: { type: String, default: null },
        categoryId: { type: String, default: null },
        welcomeMessage: { type: String, default: null },
        farewellMessage: { type: String, default: null },
        bannerUrl: { type: String, default: null }
    },

    // Level System
    levelSystem: {
        enabled: { type: Boolean, default: false },
        levelUpChannelId: { type: String, default: null },
        leaderboardChannelId: { type: String, default: null },
        categoryId: { type: String, default: null },
        leaderboardMessageId: { type: String, default: null },
        xpPerMessage: { type: Number, default: 20 },
        xpCooldown: { type: Number, default: 60 },
        levelRoles: [{
            level: { type: Number, required: true },
            roleId: { type: String, required: true },
            name: { type: String },
            anime: { type: String }
        }]
    },

    // Marketplace / Community Hub
    marketplace: {
        category: { type: String, default: null },
        hiring: { type: String, default: null },
        forHire: { type: String, default: null },
        portfolios: { type: String, default: null },
        selling: { type: String, default: null },
        discussion: { type: String, default: null } // Optional general chat
    },

    // Suggestions System
    suggestions: {
        enabled: { type: Boolean, default: false },
        categoryId: { type: String, default: null },
        panelChannelId: { type: String, default: null },
        panelMessageId: { type: String, default: null },
        serverSuggestionsChannelId: { type: String, default: null },
        skillGiveawaySuggestionsChannelId: { type: String, default: null },
        reviewRoles: [{ type: String }],
        counter: { type: Number, default: 0 }
    },

    // Stats
    totalGiveaways: { type: Number, default: 0 },
    totalTickets: { type: Number, default: 0 }
}, {
    timestamps: true
});

// Static method to find or create guild settings
guildSchema.statics.findOrCreate = async function (guildId) {
    let guild = await this.findOne({ guildId });
    if (!guild) {
        guild = await this.create({ guildId });
    }
    return guild;
};

// Method to get level role for a specific level
guildSchema.methods.getLevelRole = function (level) {
    const sortedRoles = this.levelRoles.sort((a, b) => b.level - a.level);
    return sortedRoles.find(r => r.level <= level);
};

module.exports = mongoose.model('Guild', guildSchema);
