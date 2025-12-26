const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../models/User');
const config = require('../../config');
const achievementChecker = require('../../utils/achievementChecker');
const { createAchievementCard } = require('../../utils/imageGenerator');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('achievements')
        .setDescription('View your achievements and progress')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to view achievements for')
                .setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const targetUser = interaction.options.getUser('user') || interaction.user;

            let userData = await User.findOne({
                userId: targetUser.id,
                guildId: interaction.guild.id
            });

            if (!userData) {
                userData = await User.create({
                    userId: targetUser.id,
                    guildId: interaction.guild.id
                });
            }

            const achievements = achievementChecker.getProgress(userData);
            const unlocked = achievements.filter(a => a.unlocked);
            const totalXP = unlocked.reduce((sum, a) => sum + (a.xpReward || 0), 0);

            // Try to generate image card
            const attachment = await createAchievementCard(targetUser, achievements, { totalXP });

            if (attachment) {
                // Image-based display
                const embed = new EmbedBuilder()
                    .setColor('#FFD700')
                    .setAuthor({
                        name: `🏆 ${targetUser.username}'s Achievements`,
                        iconURL: targetUser.displayAvatarURL({ dynamic: true })
                    })
                    .setDescription(`✅ **Unlocked (${unlocked.length}/${achievements.length})**\n${unlocked.length === 0 ? 'No achievements unlocked yet!' : ''}`)
                    .setImage('attachment://achievements.png')
                    .setFooter({
                        text: `Total XP from achievements: ${totalXP} XP`,
                        iconURL: interaction.guild.iconURL({ dynamic: true })
                    })
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed], files: [attachment] });
            } else {
                // Fallback to text-based display
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
                    .setFooter({ text: `Total XP from achievements: ${totalXP} XP` })
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            }

        } catch (error) {
            console.error('Achievements command error:', error);
            await interaction.editReply({ content: '❌ Failed to load achievements.' });
        }
    }
};
