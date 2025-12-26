const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../models/User');
const config = require('../../config');
const levelCalculator = require('../../utils/levelCalculator');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('View your level and XP')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to view rank for')
                .setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply();

        const targetUser = interaction.options.getUser('user') || interaction.user;

        // Get user data
        let userData = await User.findOne({
            userId: targetUser.id,
            guildId: interaction.guild.id
        });

        if (!userData) {
            userData = await User.create({ userId: targetUser.id, guildId: interaction.guild.id });
        }

        // Get rank on server
        const allUsers = await User.find({ guildId: interaction.guild.id }).sort({ totalXp: -1 });
        const rank = allUsers.findIndex(u => u.userId === targetUser.id) + 1;

        // Calculate progress
        const currentLevel = userData.level;
        const currentXp = userData.xp;
        const requiredXp = config.leveling.levelUpFormula(currentLevel + 1);
        const progress = levelCalculator.getProgress(currentXp, requiredXp);
        const progressBar = levelCalculator.createProgressBar(progress);

        // Format voice time
        const voiceHours = Math.floor(userData.voiceTime / 60);
        const voiceMinutes = userData.voiceTime % 60;

        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`📊 ${targetUser.username}'s Profile`)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: '🏆 Rank', value: `#${rank}`, inline: true },
                { name: '📊 Level', value: `${currentLevel}`, inline: true },
                { name: '⭐ Total XP', value: `${userData.totalXp.toLocaleString()}`, inline: true },
                { name: '📈 Progress', value: `${progressBar} ${progress}%\n\`${currentXp.toLocaleString()} / ${requiredXp.toLocaleString()} XP\``, inline: false },
                { name: '💬 Messages', value: `${userData.totalMessages.toLocaleString()}`, inline: true },
                { name: '🎤 Voice Time', value: `${voiceHours}h ${voiceMinutes}m`, inline: true },
                { name: '🔥 Streak', value: `${userData.currentStreak} days`, inline: true },
                { name: '🏅 Badges', value: `${userData.badges.length}`, inline: true },
                { name: '📨 Invites', value: `${(userData.invites?.regular || 0) + (userData.invites?.bonus || 0)}`, inline: true },
                { name: '🎁 Giveaways Won', value: `${userData.giveawaysWon}`, inline: true }
            )
            .setFooter({ text: `Daily XP: ${userData.dailyXp}/${config.leveling.dailyXpLimit}` })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
};
