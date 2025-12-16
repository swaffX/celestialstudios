const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('View all bot commands'),

    async execute(interaction) {
        const categories = {
            leveling: {
                emoji: '📊',
                name: 'Leveling',
                color: '#3498db',
                commands: [
                    { name: '/rank', desc: 'View your level and XP' },
                    { name: '/leaderboard', desc: 'View server leaderboard' },
                    { name: '/setlevelchannel', desc: 'Set level-up channel' },
                    { name: '/addlevelrole', desc: 'Add level role reward' }
                ]
            },
            giveaway: {
                emoji: '🎁',
                name: 'Giveaways',
                color: '#e74c3c',
                commands: [
                    { name: '/giveaway create', desc: 'Create a giveaway' },
                    { name: '/giveaway end', desc: 'End a giveaway early' },
                    { name: '/giveaway reroll', desc: 'Reroll winners' },
                    { name: '/giveaway list', desc: 'List active giveaways' }
                ]
            },
            invites: {
                emoji: '📨',
                name: 'Invites',
                color: '#9b59b6',
                commands: [
                    { name: '/invites', desc: 'View invite statistics' },
                    { name: '/inviteleaderboard', desc: 'View invite leaderboard' },
                    { name: '/addinvites', desc: 'Add bonus invites' }
                ]
            },
            moderation: {
                emoji: '🛡️',
                name: 'Moderation',
                color: '#e67e22',
                commands: [
                    { name: '/ban', desc: 'Ban a user' },
                    { name: '/kick', desc: 'Kick a user' },
                    { name: '/mute', desc: 'Timeout a user' },
                    { name: '/warn', desc: 'Warn a user' },
                    { name: '/warnings', desc: 'View warnings' },
                    { name: '/clearwarnings', desc: 'Clear warnings' }
                ]
            },
            setup: {
                emoji: '⚙️',
                name: 'Setup',
                color: '#2ecc71',
                commands: [
                    { name: '/setwelcome', desc: 'Set welcome channel' },
                    { name: '/setfarewell', desc: 'Set farewell channel' },
                    { name: '/setautorole', desc: 'Set auto role' },
                    { name: '/setuplogs', desc: 'Setup log channels' },
                    { name: '/setupinfo', desc: 'Create info center' },
                    { name: '/setuprules', desc: 'Create rules embed' },
                    { name: '/setuplinks', desc: 'Create links embed' },
                    { name: '/setuproles', desc: 'Create role buttons' }
                ]
            },
            tickets: {
                emoji: '🎫',
                name: 'Tickets',
                color: '#1abc9c',
                commands: [
                    { name: '/ticket setup', desc: 'Setup ticket system' },
                    { name: '/ticket close', desc: 'Close a ticket' },
                    { name: '/ticket add', desc: 'Add user to ticket' }
                ]
            },
            utility: {
                emoji: '🔧',
                name: 'Utility',
                color: '#95a5a6',
                commands: [
                    { name: '/help', desc: 'View all commands' },
                    { name: '/ping', desc: 'Check bot latency' },
                    { name: '/serverinfo', desc: 'Server information' },
                    { name: '/userinfo', desc: 'User information' },
                    { name: '/avatar', desc: 'View avatar' }
                ]
            }
        };

        // Create main embed
        const mainEmbed = new EmbedBuilder()
            .setColor('#5865F2')
            .setAuthor({
                name: interaction.client.user.username,
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setTitle('📚 Command Center')
            .setDescription(
                `Hello **${interaction.user.username}**! 👋\n\n` +
                `Select a category from the dropdown below to view available commands.\n\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
            )
            .setThumbnail(interaction.client.user.displayAvatarURL({ size: 256 }))
            .addFields(
                Object.entries(categories).map(([key, cat]) => ({
                    name: `${cat.emoji} ${cat.name}`,
                    value: `\`${cat.commands.length}\` commands`,
                    inline: true
                }))
            )
            .setFooter({
                text: `Requested by ${interaction.user.tag} • Total: ${Object.values(categories).reduce((sum, cat) => sum + cat.commands.length, 0)} commands`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp();

        // Create dropdown menu
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('help_select')
            .setPlaceholder('🔍 Select a category...')
            .addOptions(
                Object.entries(categories).map(([key, cat]) => ({
                    label: cat.name,
                    description: `View ${cat.commands.length} ${cat.name.toLowerCase()} commands`,
                    value: `help_${key}`,
                    emoji: cat.emoji
                }))
            );

        const row = new ActionRowBuilder().addComponents(selectMenu);

        // Create support button row
        const buttonRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('help_home')
                .setLabel('Home')
                .setEmoji('🏠')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setLabel('Support Server')
                .setEmoji('💬')
                .setStyle(ButtonStyle.Link)
                .setURL('https://discord.gg/celestialstudios')
        );

        await interaction.reply({
            embeds: [mainEmbed],
            components: [row, buttonRow],
            ephemeral: false
        });
    }
};

// Export categories for use in interactionCreate
module.exports.categories = {
    leveling: {
        emoji: '📊',
        name: 'Leveling',
        color: '#3498db',
        commands: [
            { name: '/rank', desc: 'View your level and XP' },
            { name: '/leaderboard', desc: 'View server leaderboard' },
            { name: '/setlevelchannel', desc: 'Set level-up channel' },
            { name: '/addlevelrole', desc: 'Add level role reward' }
        ]
    },
    giveaway: {
        emoji: '🎁',
        name: 'Giveaways',
        color: '#e74c3c',
        commands: [
            { name: '/giveaway create', desc: 'Create a giveaway' },
            { name: '/giveaway end', desc: 'End a giveaway early' },
            { name: '/giveaway reroll', desc: 'Reroll winners' },
            { name: '/giveaway list', desc: 'List active giveaways' }
        ]
    },
    invites: {
        emoji: '📨',
        name: 'Invites',
        color: '#9b59b6',
        commands: [
            { name: '/invites', desc: 'View invite statistics' },
            { name: '/inviteleaderboard', desc: 'View invite leaderboard' },
            { name: '/addinvites', desc: 'Add bonus invites' }
        ]
    },
    moderation: {
        emoji: '🛡️',
        name: 'Moderation',
        color: '#e67e22',
        commands: [
            { name: '/ban', desc: 'Ban a user' },
            { name: '/kick', desc: 'Kick a user' },
            { name: '/mute', desc: 'Timeout a user' },
            { name: '/warn', desc: 'Warn a user' },
            { name: '/warnings', desc: 'View warnings' },
            { name: '/clearwarnings', desc: 'Clear warnings' }
        ]
    },
    setup: {
        emoji: '⚙️',
        name: 'Setup',
        color: '#2ecc71',
        commands: [
            { name: '/setwelcome', desc: 'Set welcome channel' },
            { name: '/setfarewell', desc: 'Set farewell channel' },
            { name: '/setautorole', desc: 'Set auto role' },
            { name: '/setuplogs', desc: 'Setup log channels' },
            { name: '/setupinfo', desc: 'Create info center' },
            { name: '/setuprules', desc: 'Create rules embed' },
            { name: '/setuplinks', desc: 'Create links embed' },
            { name: '/setuproles', desc: 'Create role buttons' }
        ]
    },
    tickets: {
        emoji: '🎫',
        name: 'Tickets',
        color: '#1abc9c',
        commands: [
            { name: '/ticket setup', desc: 'Setup ticket system' },
            { name: '/ticket close', desc: 'Close a ticket' },
            { name: '/ticket add', desc: 'Add user to ticket' }
        ]
    },
    utility: {
        emoji: '🔧',
        name: 'Utility',
        color: '#95a5a6',
        commands: [
            { name: '/help', desc: 'View all commands' },
            { name: '/ping', desc: 'Check bot latency' },
            { name: '/serverinfo', desc: 'Server information' },
            { name: '/userinfo', desc: 'User information' },
            { name: '/avatar', desc: 'View avatar' }
        ]
    }
};
