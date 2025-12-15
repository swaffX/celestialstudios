const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('View all bot commands')
        .addStringOption(option =>
            option.setName('category')
                .setDescription('Command category')
                .setRequired(false)
                .addChoices(
                    { name: 'Leveling', value: 'leveling' },
                    { name: 'Giveaways', value: 'giveaway' },
                    { name: 'Achievements', value: 'achievements' },
                    { name: 'Invites', value: 'invites' },
                    { name: 'Moderation', value: 'moderation' },
                    { name: 'Settings', value: 'settings' },
                    { name: 'Tickets', value: 'tickets' },
                    { name: 'Utility', value: 'utility' }
                )),

    async execute(interaction) {
        const category = interaction.options.getString('category');

        const categories = {
            leveling: {
                emoji: '📊',
                name: 'Leveling',
                commands: [
                    { name: '/rank', desc: 'View your level and XP' },
                    { name: '/leaderboard', desc: 'View server leaderboard' },
                    { name: '/setlevelchannel', desc: 'Set level-up channel (Admin)' },
                    { name: '/addlevelrole', desc: 'Add level role (Admin)' }
                ]
            },
            giveaway: {
                emoji: '🎁',
                name: 'Giveaways',
                commands: [
                    { name: '/giveaway create', desc: 'Create a giveaway' },
                    { name: '/giveaway end', desc: 'End a giveaway early' },
                    { name: '/giveaway reroll', desc: 'Reroll winners' },
                    { name: '/giveaway list', desc: 'List active giveaways' }
                ]
            },
            achievements: {
                emoji: '🏆',
                name: 'Achievements',
                commands: [
                    { name: '/achievements', desc: 'View your achievements' },
                    { name: '/badges', desc: 'View your badges' }
                ]
            },
            invites: {
                emoji: '📨',
                name: 'Invites',
                commands: [
                    { name: '/invites', desc: 'View invite statistics' },
                    { name: '/inviteleaderboard', desc: 'View invite leaderboard' },
                    { name: '/addinvites', desc: 'Add bonus invites (Admin)' }
                ]
            },
            moderation: {
                emoji: '🛡️',
                name: 'Moderation',
                commands: [
                    { name: '/ban', desc: 'Ban a user' },
                    { name: '/kick', desc: 'Kick a user' },
                    { name: '/mute', desc: 'Mute (timeout) a user' },
                    { name: '/warn', desc: 'Warn a user' },
                    { name: '/warnings', desc: 'View warnings' },
                    { name: '/clearwarnings', desc: 'Clear warnings (Admin)' }
                ]
            },
            settings: {
                emoji: '⚙️',
                name: 'Settings',
                commands: [
                    { name: '/settings', desc: 'View server settings' },
                    { name: '/setwelcome', desc: 'Set welcome channel' },
                    { name: '/setfarewell', desc: 'Set farewell channel' },
                    { name: '/setautorole', desc: 'Set auto role' },
                    { name: '/setmodlog', desc: 'Set mod log channel' }
                ]
            },
            tickets: {
                emoji: '🎫',
                name: 'Tickets',
                commands: [
                    { name: '/ticket setup', desc: 'Setup ticket system' },
                    { name: '/ticket close', desc: 'Close a ticket' },
                    { name: '/ticket add', desc: 'Add user to ticket' }
                ]
            },
            utility: {
                emoji: '🔧',
                name: 'Utility',
                commands: [
                    { name: '/help', desc: 'View all commands' },
                    { name: '/ping', desc: 'Check bot latency' },
                    { name: '/info', desc: 'Server information' },
                    { name: '/userinfo', desc: 'User information' },
                    { name: '/avatar', desc: 'View avatar' },
                    { name: '/stats', desc: 'Bot statistics' }
                ]
            }
        };

        if (category && categories[category]) {
            const cat = categories[category];
            const commandList = cat.commands.map(c => `\`${c.name}\` - ${c.desc}`).join('\n');

            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle(`${cat.emoji} ${cat.name} Commands`)
                .setDescription(commandList)
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        }

        // Show all categories
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle('📚 Celestial Studios Bot - Commands')
            .setDescription('Use `/help <category>` to see commands in a specific category.')
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .setTimestamp();

        for (const [key, cat] of Object.entries(categories)) {
            embed.addFields({
                name: `${cat.emoji} ${cat.name}`,
                value: `\`${cat.commands.length}\` commands`,
                inline: true
            });
        }

        await interaction.reply({ embeds: [embed] });
    }
};
