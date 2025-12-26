const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    channelId: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    userTag: { type: String, required: true },

    // Ticket Info
    ticketNumber: { type: Number, required: true },
    subject: { type: String, default: 'Support Request' },

    // Status
    status: {
        type: String,
        enum: ['open', 'closed', 'on-hold'],
        default: 'open'
    },

    // Staff
    claimedBy: { type: String, default: null },
    claimedByTag: { type: String, default: null },

    // Participants
    addedUsers: [{ type: String }],

    // Transcript
    transcript: [{
        authorId: { type: String },
        authorTag: { type: String },
        content: { type: String },
        timestamp: { type: Date, default: Date.now }
    }],

    // Timestamps
    closedAt: { type: Date, default: null },
    closedBy: { type: String, default: null }
}, {
    timestamps: true
});

// Indexes
ticketSchema.index({ guildId: 1, status: 1 });
ticketSchema.index({ userId: 1, guildId: 1 });

module.exports = mongoose.model('Ticket', ticketSchema);
