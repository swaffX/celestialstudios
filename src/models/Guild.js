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

    // Messages
    welcomeMessage: {
        type: String,
        default: 'Hoş geldin {user}! 🎉 Sunucumuza katıldığın için teşekkürler.'
    },
    farewellMessage: {
        type: String,
        default: '{user} sunucudan ayrıldı. Görüşmek üzere! 👋'
    },
    levelUpMessage: {
        type: String,
        default: 'Tebrikler {user}! 🎊 **Seviye {level}** oldun!'
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
