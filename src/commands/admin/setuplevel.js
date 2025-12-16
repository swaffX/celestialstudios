const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder, MessageFlags } = require('discord.js');
const embedBuilder = require('../../utils/embedBuilder');
const Guild = require('../../models/Guild');

// Anime-themed level roles (10 levels)
const ANIME_ROLES = [
    { level: 5, name: '🍃 Academy Student', color: '#90EE90', anime: 'Naruto' },
    { level: 10, name: '⚔️ Genin', color: '#3498db', anime: 'Naruto' },
    { level: 15, name: '🏴‍☠️ East Blue Pirate', color: '#e74c3c', anime: 'One Piece' },
    { level: 20, name: '👹 Demon Slayer Corps', color: '#9b59b6', anime: 'Demon Slayer' },
    { level: 30, name: '🔥 Chunin', color: '#e67e22', anime: 'Naruto' },
    { level: 40, name: '⛵ Grand Line Pirate', color: '#f1c40f', anime: 'One Piece' },
    { level: 50, name: '💀 Jujutsu Sorcerer', color: '#1abc9c', anime: 'Jujutsu Kaisen' },
    { level: 65, name: '🗡️ Hashira', color: '#e91e63', anime: 'Demon Slayer' },
    { level: 80, name: '💎 Gotei 13 Captain', color: '#00bcd4', anime: 'Bleach' },
    { level: 100, name: '👑 Kage/Yonko', color: '#FFD700', anime: 'Naruto/One Piece' }
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setuplevel')
        .setDescription('Setup leveling system with auto channels and anime-themed roles')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addBooleanOption(option =>
            option.setName('create_roles')
                .setDescription('Create anime-themed level roles? (10 roles)')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('xp_per_message')
                .setDescription('XP gained per message (default: 15-25)')
                .setRequired(false)
                .setMinValue(5)
                .setMaxValue(100))
        .addIntegerOption(option =>
            option.setName('xp_cooldown')
                .setDescription('Cooldown between XP gains in seconds (default: 60)')
                .setRequired(false)
                .setMinValue(10)
                .setMaxValue(300)),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            const guild = interaction.guild;
            const createRoles = interaction.options.getBoolean('create_roles') ?? true;
            const xpPerMessage = interaction.options.getInteger('xp_per_message') || 20;
            const xpCooldown = interaction.options.getInteger('xp_cooldown') || 60;

            // Create LEVELING category
            let levelCategory = guild.channels.cache.find(
                c => c.type === ChannelType.GuildCategory && c.name.toUpperCase().includes('LEVEL')
            );

            if (!levelCategory) {
                levelCategory = await guild.channels.create({
                    name: '📊 LEVELING',
                    type: ChannelType.GuildCategory
                });
            }

            // Create level-up channel
            let levelUpChannel = guild.channels.cache.find(
                c => c.name === 'level-up' && c.parentId === levelCategory.id
            );
            if (!levelUpChannel) {
                levelUpChannel = await guild.channels.create({
                    name: 'level-up',
                    type: ChannelType.GuildText,
                    parent: levelCategory.id,
                    topic: '🎉 Level up announcements'
                });
            }

            // Create leaderboard channel
            let leaderboardChannel = guild.channels.cache.find(
                c => c.name === 'leaderboard' && c.parentId === levelCategory.id
            );
            if (!leaderboardChannel) {
                leaderboardChannel = await guild.channels.create({
                    name: 'leaderboard',
                    type: ChannelType.GuildText,
                    parent: levelCategory.id,
                    topic: '🏆 Server leaderboard',
                    permissionOverwrites: [
                        {
                            id: guild.id,
                            deny: ['SendMessages'],
                            allow: ['ViewChannel']
                        },
                        {
                            id: interaction.client.user.id,
                            allow: ['SendMessages', 'ViewChannel', 'ManageMessages']
                        }
                    ]
                });
            }

            // Create level roles if requested
            const createdRoles = [];
            if (createRoles) {
                for (const roleData of ANIME_ROLES) {
                    let role = guild.roles.cache.find(r => r.name === roleData.name);
                    if (!role) {
                        role = await guild.roles.create({
                            name: roleData.name,
                            color: roleData.color,
                            reason: `Level ${roleData.level} role - ${roleData.anime}`,
                            hoist: false,
                            mentionable: false
                        });
                    }
                    createdRoles.push({ level: roleData.level, roleId: role.id, name: role.name, anime: roleData.anime });
                }
            }

            // Save to database
            await Guild.findOneAndUpdate(
                { guildId: guild.id },
                {
                    'levelSystem.enabled': true,
                    'levelSystem.levelUpChannelId': levelUpChannel.id,
                    'levelSystem.leaderboardChannelId': leaderboardChannel.id,
                    'levelSystem.categoryId': levelCategory.id,
                    'levelSystem.xpPerMessage': xpPerMessage,
                    'levelSystem.xpCooldown': xpCooldown,
                    'levelSystem.levelRoles': createdRoles
                },
                { upsert: true }
            );

            // Send leaderboard embed
            const leaderboardEmbed = new EmbedBuilder()
                .setColor('#FFD700')
                .setAuthor({ name: guild.name, iconURL: guild.iconURL({ dynamic: true }) })
                .setTitle('🏆 Server Leaderboard')
                .setDescription(
                    `> Top members will be displayed here!\n\n` +
                    `╭──────────────────────────╮\n\n` +
                    `🥇 **#1** — *Waiting for data...*\n` +
                    `🥈 **#2** — *Waiting for data...*\n` +
                    `🥉 **#3** — *Waiting for data...*\n\n` +
                    `╰──────────────────────────╯`
                )
                .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
                .setFooter({ text: 'Updates every hour • /rank to check your level' })
                .setTimestamp();

            const leaderboardMsg = await leaderboardChannel.send({ embeds: [leaderboardEmbed] });

            // Save leaderboard message ID
            await Guild.findOneAndUpdate(
                { guildId: guild.id },
                { 'levelSystem.leaderboardMessageId': leaderboardMsg.id }
            );

            // Send level roles info
            const rolesEmbed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('🎭 Anime Level Roles')
                .setDescription(
                    `> Earn XP by chatting to unlock these roles!\n\n` +
                    createdRoles.map(r => `**Level ${r.level}** — <@&${r.roleId}>\n> *${r.anime}*`).join('\n\n')
                )
                .setFooter({ text: `${xpPerMessage} XP per message • ${xpCooldown}s cooldown` })
                .setTimestamp();

            await levelUpChannel.send({ embeds: [rolesEmbed] });

            // Success response
            const successEmbed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setTitle('✅ Level System Setup Complete!')
                .setDescription(
                    `**Channels Created:**\n` +
                    `> 🎉 Level-Up: ${levelUpChannel}\n` +
                    `> 🏆 Leaderboard: ${leaderboardChannel}\n\n` +
                    `**Roles Created:** ${createdRoles.length}\n` +
                    `**XP Settings:**\n` +
                    `> Per Message: \`${xpPerMessage} XP\`\n` +
                    `> Cooldown: \`${xpCooldown} seconds\``
                )
                .setFooter({ text: 'Leaderboard updates every hour' })
                .setTimestamp();

            await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            console.error('Setup level error:', error);
            await interaction.editReply({
                embeds: [embedBuilder.error('Error', `Failed to setup level system: ${error.message}`)]
            });
        }
    }
};

module.exports.ANIME_ROLES = ANIME_ROLES;
