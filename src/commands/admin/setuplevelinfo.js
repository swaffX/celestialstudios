const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder, MessageFlags } = require('discord.js');
const embedBuilder = require('../../utils/embedBuilder');
const Guild = require('../../models/Guild');
const logger = require('../../utils/logger');

// Anime-themed level roles (matching setuplevel.js)
const ANIME_ROLES = [
    { level: 5, name: '🍃 Academy Student', color: '#90EE90', anime: 'Naruto', description: 'You have begun your journey!' },
    { level: 10, name: '⚔️ Genin', color: '#3498db', anime: 'Naruto', description: 'A full-fledged ninja!' },
    { level: 15, name: '🏴‍☠️ East Blue Pirate', color: '#e74c3c', anime: 'One Piece', description: 'Ready for adventure!' },
    { level: 20, name: '👹 Demon Slayer Corps', color: '#9b59b6', anime: 'Demon Slayer', description: 'Sworn to protect humanity!' },
    { level: 30, name: '🔥 Chunin', color: '#e67e22', anime: 'Naruto', description: 'A skilled tactician!' },
    { level: 40, name: '⛵ Grand Line Pirate', color: '#f1c40f', anime: 'One Piece', description: 'Sailing the greatest seas!' },
    { level: 50, name: '💀 Jujutsu Sorcerer', color: '#1abc9c', anime: 'Jujutsu Kaisen', description: 'Master of cursed energy!' },
    { level: 65, name: '🗡️ Hashira', color: '#e91e63', anime: 'Demon Slayer', description: 'Elite among the elite!' },
    { level: 80, name: '💎 Gotei 13 Captain', color: '#00bcd4', anime: 'Bleach', description: 'Commander of a division!' },
    { level: 100, name: '👑 Kage/Yonko', color: '#FFD700', anime: 'Naruto/One Piece', description: 'The pinnacle of power!' }
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setuplevelinfo')
        .setDescription('Send a detailed level roles info embed to a channel')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel to send the info embed (default: current)')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            const guild = interaction.guild;
            const targetChannel = interaction.options.getChannel('channel') || interaction.channel;

            // Build level roles description
            let rolesDescription = '';
            for (const role of ANIME_ROLES) {
                rolesDescription += `### ${role.name}\n`;
                rolesDescription += `> 📊 **Level ${role.level}** • *${role.anime}*\n`;
                rolesDescription += `> ${role.description}\n\n`;
            }

            // Create the main embed
            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('📊 Level Roles Guide')
                .setDescription(
                    `## Welcome to the Leveling System!\n\n` +
                    `> Earn XP by chatting and spending time in voice channels.\n` +
                    `> As you level up, you'll unlock exclusive anime-themed roles!\n\n` +
                    `╭───────────────────────────────────╮\n\n` +
                    `### 💡 How to Earn XP\n` +
                    `> 💬 **Chatting:** 15-25 XP per message (60s cooldown)\n` +
                    `> 🎤 **Voice:** 2 XP per minute in voice channels\n` +
                    `> 📨 **Invites:** 100 XP per successful invite\n\n` +
                    `╰───────────────────────────────────╯`
                )
                .setThumbnail(guild.iconURL({ dynamic: true, size: 512 }))
                .setFooter({ text: 'Use /rank to check your progress!', iconURL: guild.iconURL({ dynamic: true }) })
                .setTimestamp();

            // Create separate embeds for role tiers (to avoid character limits)
            const tierEmbed1 = new EmbedBuilder()
                .setColor('#43B581')
                .setTitle('🌱 Beginner Roles (Level 5-20)')
                .setDescription(
                    `### 🍃 Academy Student\n` +
                    `> **Level 5** • *Naruto*\n` +
                    `> You have begun your journey!\n\n` +
                    `### ⚔️ Genin\n` +
                    `> **Level 10** • *Naruto*\n` +
                    `> A full-fledged ninja!\n\n` +
                    `### 🏴‍☠️ East Blue Pirate\n` +
                    `> **Level 15** • *One Piece*\n` +
                    `> Ready for adventure!\n\n` +
                    `### 👹 Demon Slayer Corps\n` +
                    `> **Level 20** • *Demon Slayer*\n` +
                    `> Sworn to protect humanity!`
                );

            const tierEmbed2 = new EmbedBuilder()
                .setColor('#f1c40f')
                .setTitle('⚡ Intermediate Roles (Level 30-50)')
                .setDescription(
                    `### 🔥 Chunin\n` +
                    `> **Level 30** • *Naruto*\n` +
                    `> A skilled tactician!\n\n` +
                    `### ⛵ Grand Line Pirate\n` +
                    `> **Level 40** • *One Piece*\n` +
                    `> Sailing the greatest seas!\n\n` +
                    `### 💀 Jujutsu Sorcerer\n` +
                    `> **Level 50** • *Jujutsu Kaisen*\n` +
                    `> Master of cursed energy!`
                );

            const tierEmbed3 = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('👑 Elite Roles (Level 65-100)')
                .setDescription(
                    `### 🗡️ Hashira\n` +
                    `> **Level 65** • *Demon Slayer*\n` +
                    `> Elite among the elite!\n\n` +
                    `### 💎 Gotei 13 Captain\n` +
                    `> **Level 80** • *Bleach*\n` +
                    `> Commander of a division!\n\n` +
                    `### 👑 Kage/Yonko\n` +
                    `> **Level 100** • *Naruto/One Piece*\n` +
                    `> The pinnacle of power! 🏆`
                );

            // XP formula info embed
            const xpEmbed = new EmbedBuilder()
                .setColor('#9b59b6')
                .setTitle('📈 XP & Level Formula')
                .setDescription(
                    `> The XP required for each level follows this formula:\n` +
                    `> **XP = 100 × Level^1.8**\n\n` +
                    `### Example Requirements:\n` +
                    `> 📊 Level 5: ~700 XP\n` +
                    `> 📊 Level 10: ~2,500 XP\n` +
                    `> 📊 Level 25: ~12,000 XP\n` +
                    `> 📊 Level 50: ~40,000 XP\n` +
                    `> 📊 Level 100: ~160,000 XP\n\n` +
                    `### Tips:\n` +
                    `> 💡 Be active daily for streak bonuses!\n` +
                    `> 💡 Invite friends for extra XP!\n` +
                    `> 💡 Join voice channels while you play!`
                )
                .setFooter({ text: 'Good luck on your journey! 🌟' });

            // Send all embeds
            await targetChannel.send({ embeds: [embed] });
            await targetChannel.send({ embeds: [tierEmbed1, tierEmbed2, tierEmbed3] });
            await targetChannel.send({ embeds: [xpEmbed] });

            // Success response
            await interaction.editReply({
                embeds: [embedBuilder.success('Level Info Sent!', `Level roles info has been posted to ${targetChannel}!`)]
            });

            logger.info(`Level info embed sent by ${interaction.user.tag} to #${targetChannel.name}`);

        } catch (error) {
            logger.error('Setup level info error:', error);
            await interaction.editReply({
                embeds: [embedBuilder.error('Error', `Failed to send level info: ${error.message}`)]
            });
        }
    }
};
