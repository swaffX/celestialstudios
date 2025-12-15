const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embedBuilder = require('../../utils/embedBuilder');
const Guild = require('../../models/Guild');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addlevelrole')
        .setDescription('Add a role reward for reaching a level')
        .addIntegerOption(option =>
            option.setName('level')
                .setDescription('Level required to get the role')
                .setRequired(true)
                .setMinValue(1))
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('Role to give at this level')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        const level = interaction.options.getInteger('level');
        const role = interaction.options.getRole('role');

        // Check if role is manageable
        if (role.position >= interaction.guild.members.me.roles.highest.position) {
            return interaction.reply({
                embeds: [embedBuilder.error('Error', 'I cannot manage this role!')],
                ephemeral: true
            });
        }

        const guildSettings = await Guild.findOrCreate(interaction.guild.id);

        // Remove existing role for this level if any
        guildSettings.levelRoles = guildSettings.levelRoles.filter(r => r.level !== level);

        // Add new level role
        guildSettings.levelRoles.push({ level, roleId: role.id });
        guildSettings.levelRoles.sort((a, b) => a.level - b.level);

        await guildSettings.save();

        await interaction.reply({
            embeds: [embedBuilder.success('Level Role Added',
                `${role} will now be given when users reach **Level ${level}**!`
            )]
        });
    }
};
