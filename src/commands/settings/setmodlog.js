const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js'); const { MessageFlags } = require('discord.js');
const embedBuilder = require('../../utils/embedBuilder');
const Guild = require('../../models/Guild');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setmodlog')
        .setDescription('Set the moderation log channel')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel for mod log messages')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');

        if (channel.type !== 0) {
            return interaction.reply({
                embeds: [embedBuilder.error('Error', 'Please select a text channel!')],
                flags: MessageFlags.Ephemeral
            });
        }

        const guildSettings = await Guild.findOrCreate(interaction.guild.id);
        guildSettings.modLogChannel = channel.id;
        await guildSettings.save();

        await interaction.reply({
            embeds: [embedBuilder.success(
                'Mod Log Channel Set',
                `Moderation logs will now be sent to ${channel}!`
            )]
        });
    }
};
