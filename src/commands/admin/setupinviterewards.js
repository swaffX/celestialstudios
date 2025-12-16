const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js');
const embedBuilder = require('../../utils/embedBuilder');
const Guild = require('../../models/Guild');
const logger = require('../../utils/logger');

// Default milestone roles
const DEFAULT_MILESTONES = [
    { invites: 10, name: '📨 Inviter', color: '#3498db' },
    { invites: 25, name: '🌟 Recruiter', color: '#9b59b6' },
    { invites: 50, name: '👑 Ambassador', color: '#f1c40f' }
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setupinviterewards')
        .setDescription('Setup automatic role rewards for invite milestones')
        .addBooleanOption(option =>
            option.setName('create_roles')
                .setDescription('Auto-create roles for milestones? (default: true)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            const guild = interaction.guild;
            const createRoles = interaction.options.getBoolean('create_roles') ?? true;

            const guildSettings = await Guild.findOrCreate(guild.id);
            const milestones = [];

            if (createRoles) {
                // Create milestone roles
                for (const milestone of DEFAULT_MILESTONES) {
                    // Check if role exists
                    let existingRole = guild.roles.cache.find(r => r.name === milestone.name);

                    if (!existingRole) {
                        existingRole = await guild.roles.create({
                            name: milestone.name,
                            color: milestone.color,
                            reason: `Invite reward role for ${milestone.invites} invites`
                        });
                        logger.info(`Created invite reward role: ${milestone.name}`);
                    }

                    milestones.push({
                        invites: milestone.invites,
                        roleId: existingRole.id,
                        name: milestone.name
                    });
                }
            }

            // Save to database
            guildSettings.inviteRewards = {
                enabled: true,
                milestones: milestones
            };
            await guildSettings.save();

            // Create success embed
            const embed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setTitle('✅ Invite Rewards Setup Complete!')
                .setDescription(
                    `**Milestone Rewards:**\n\n` +
                    milestones.map(m => `> **${m.invites} invites** → <@&${m.roleId}>`).join('\n') +
                    `\n\n*Members will automatically receive these roles when they reach the invite milestones!*`
                )
                .setFooter({ text: 'Invite rewards are now active' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
            logger.info(`Invite rewards setup by ${interaction.user.tag}`);

        } catch (error) {
            logger.error('Setup invite rewards error:', error);
            await interaction.editReply({
                embeds: [embedBuilder.error('Error', `Failed to setup invite rewards: ${error.message}`)]
            });
        }
    }
};
