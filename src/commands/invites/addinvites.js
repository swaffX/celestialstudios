const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const User = require('../../models/User');
const embedBuilder = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addinvites')
        .setDescription('Add bonus invites to a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to add bonus invites to')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of bonus invites to add')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');

        // Get or create user data
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

        // Add bonus invites
        userData.bonusInvites += amount;
        await userData.save();

        const totalInvites = userData.invites + userData.bonusInvites;

        await interaction.reply({
            embeds: [embedBuilder.success('Bonus Invites Added',
                `Added **${amount}** bonus invites to ${targetUser}!\n\n` +
                `📊 Total Invites: ${totalInvites}\n` +
                `✅ Regular: ${userData.invites}\n` +
                `🎁 Bonus: ${userData.bonusInvites}`
            )]
        });
    }
};
