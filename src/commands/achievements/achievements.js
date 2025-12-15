const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../models/User');
const config = require('../../config');
const achievementChecker = require('../../utils/achievementChecker');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('achievements')
        .setDescription('View your achievements and progress')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to view achievements for')
                .setRequired(false)),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;

        let userData = await User.findOne({
            odasi: targetUser.id,
            odaId: interaction.guild.id
        });

        if (!userData) {
            userData = await User.create({
                odasi: targetUser.id,
                odaId: interaction.guild.id
            });
        }

        const achievements = achievementChecker.getProgress(userData);

        const unlocked = achievements.filter(a => a.unlocked);
        const locked = achievements.filter(a => !a.unlocked);

        const unlockedText = unlocked.length > 0
            ? unlocked.map(a => `${a.name}\n└ ${a.badge}`).join('\n\n')
            : 'No achievements unlocked yet!';

        const lockedText = locked.slice(0, 5).map(a => {
            const progressBar = '█'.repeat(Math.floor(a.progress / 10)) + '░'.repeat(10 - Math.floor(a.progress / 10));
            return `${a.name}\n└ [${progressBar}] ${a.progress}% (${a.current}/${a.required})`;
        }).join('\n\n');

        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`🏆 ${targetUser.username}'s Achievements`)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .addFields(
                {
                    name: `✅ Unlocked (${unlocked.length}/${achievements.length})`,
                    value: unlockedText || 'None',
                    inline: false
                },
                {
                    name: '🔒 In Progress',
                    value: lockedText || 'All achievements unlocked!',
                    inline: false
                }
            )
            .setFooter({ text: `Total XP from achievements: ${unlocked.reduce((sum, a) => sum + a.xpReward, 0)} XP` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
