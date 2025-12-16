const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');

const HELP_BANNER = 'https://cdn.discordapp.com/attachments/1447262708440236084/1450284176564818063/Gemini_Generated_Image_eyxkuceyxkuceyxk.png';

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
                    { name: '/inviteleaderboard', desc: 'Invite leaderboard' },
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
                    { name: '/setuplogs', desc: 'Setup log channels' },
                    { name: '/setupinfo', desc: 'Create info center' },
                    { name: '/setuprules', desc: 'Create rules embed' },
                    { name: '/setuplinks', desc: 'Create links embed' },
                    { name: '/setuproles', desc: 'Create role buttons' },
                    { name: '/setupbooster', desc: 'Booster leaderboard' }
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

        // Create modern embed with stylized fields
        const mainEmbed = new EmbedBuilder()
            .setColor('#5865F2')
            .setAuthor({
                name: `${interaction.client.user.username} • Command Center`,
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setDescription(
                `> 👋 Hey **${interaction.user.username}**!\n` +
                `> \n` +
                `> Select a category below to explore commands.\n` +
                `> Each category contains useful features!\n\n` +
                `╭──────────────────────────╮`
            )
            .setImage(HELP_BANNER)
            .setFooter({
                text: `📚 ${Object.values(categories).reduce((sum, cat) => sum + cat.commands.length, 0)} Total Commands`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp();

        // Add category fields with modern styling
        for (const [key, cat] of Object.entries(categories)) {
            mainEmbed.addFields({
                name: `${cat.emoji} **${cat.name}**`,
                value: `\`\`\`${cat.commands.length} cmds\`\`\``,
                inline: true
            });
        }

        // Create dropdown menu
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('help_select')
            .setPlaceholder('🔍 Browse command categories...')
            .addOptions(
                Object.entries(categories).map(([key, cat]) => ({
                    label: cat.name,
                    description: `${cat.commands.length} ${cat.name.toLowerCase()} commands`,
                    value: `help_${key}`,
                    emoji: cat.emoji
                }))
            );

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const buttonRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('help_home')
                .setLabel('Home')
                .setEmoji('🏠')
                .setStyle(ButtonStyle.Primary)
        );

        await interaction.reply({
            embeds: [mainEmbed],
            components: [row, buttonRow]
        });
    }
};
