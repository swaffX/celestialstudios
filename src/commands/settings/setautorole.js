const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embedBuilder = require('../../utils/embedBuilder');
const Guild = require('../../models/Guild');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setautorole')
        .setDescription('Set auto role for new members')
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('Role to give to new members')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        const role = interaction.options.getRole('role');

        // Check if role is manageable
        if (role.position >= interaction.guild.members.me.roles.highest.position) {
            return interaction.reply({
                embeds: [embedBuilder.error('Error', 'I cannot manage this role!')],
                ephemeral: true
            });
        }

        const guildSettings = await Guild.findOrCreate(interaction.guild.id);

        // Toggle role
        if (guildSettings.autoRoles.includes(role.id)) {
            guildSettings.autoRoles = guildSettings.autoRoles.filter(r => r !== role.id);
            await guildSettings.save();

            return interaction.reply({
                embeds: [embedBuilder.success('Auto Role Removed',
                    `${role} will no longer be given automatically.`
                )]
            });
        }

        guildSettings.autoRoles.push(role.id);
        await guildSettings.save();

        await interaction.reply({
            embeds: [embedBuilder.success('Auto Role Added',
                `${role} will now be given to new members automatically!`
            )]
        });
    }
};
