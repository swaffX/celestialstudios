const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js'); const { MessageFlags } = require('discord.js');
const embedBuilder = require('../../utils/embedBuilder');
const Guild = require('../../models/Guild');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setfarewell')
        .setDescription('Set the farewell channel')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel for farewell messages')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Farewell message ({user}, {username}, {server}, {memberCount})')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');
        const message = interaction.options.getString('message');

        if (channel.type !== 0) {
            return interaction.reply({
                embeds: [embedBuilder.error('Error', 'Please select a text channel!')],
                flags: MessageFlags.Ephemeral
            });
        }

        const guildSettings = await Guild.findOrCreate(interaction.guild.id);
        guildSettings.farewellChannel = channel.id;

        if (message) {
            guildSettings.farewellMessage = message;
        }

        await guildSettings.save();

        await interaction.reply({
            embeds: [embedBuilder.success(
                'Farewell Channel Set',
                `Farewell messages will now be sent to ${channel}!\n\n` +
                `**Message:** ${guildSettings.farewellMessage}`
            )]
        });
    }
};
