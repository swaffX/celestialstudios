const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const ms = require('ms');
const embedBuilder = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Giveaway commands')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a new giveaway')
                .addStringOption(option =>
                    option.setName('prize')
                        .setDescription('Giveaway prize')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('duration')
                        .setDescription('Giveaway duration (e.g. 1d, 12h, 30m)')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('winners')
                        .setDescription('Number of winners')
                        .setRequired(false)
                        .setMinValue(1)
                        .setMaxValue(10))
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription('Giveaway description')
                        .setRequired(false))
                .addRoleOption(option =>
                    option.setName('required_role')
                        .setDescription('Required role to enter')
                        .setRequired(false))
                .addIntegerOption(option =>
                    option.setName('min_level')
                        .setDescription('Minimum level requirement')
                        .setRequired(false)
                        .setMinValue(1))
                .addIntegerOption(option =>
                    option.setName('min_messages')
                        .setDescription('Minimum messages requirement')
                        .setRequired(false)
                        .setMinValue(1))
                .addIntegerOption(option =>
                    option.setName('min_account_age')
                        .setDescription('Minimum account age (days)')
                        .setRequired(false)
                        .setMinValue(1))
                .addIntegerOption(option =>
                    option.setName('min_server_age')
                        .setDescription('Minimum days in server')
                        .setRequired(false)
                        .setMinValue(1))
                .addIntegerOption(option =>
                    option.setName('min_invites')
                        .setDescription('Minimum invites requirement (Special Giveaway)')
                        .setRequired(false)
                        .setMinValue(1)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('end')
                .setDescription('End a giveaway early')
                .addStringOption(option =>
                    option.setName('message_id')
                        .setDescription('Giveaway message ID')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('reroll')
                .setDescription('Reroll giveaway winners')
                .addStringOption(option =>
                    option.setName('message_id')
                        .setDescription('Giveaway message ID')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('count')
                        .setDescription('Number of new winners')
                        .setRequired(false)
                        .setMinValue(1)
                        .setMaxValue(10)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List active giveaways'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'create':
                await this.handleCreate(interaction, client);
                break;
            case 'end':
                await this.handleEnd(interaction, client);
                break;
            case 'reroll':
                await this.handleReroll(interaction, client);
                break;
            case 'list':
                await this.handleList(interaction, client);
                break;
        }
    },

    async handleCreate(interaction, client) {
        const prize = interaction.options.getString('prize');
        const durationStr = interaction.options.getString('duration');
        const winnersCount = interaction.options.getInteger('winners') || 1;
        const description = interaction.options.getString('description') || '';
        const requiredRole = interaction.options.getRole('required_role');
        const minLevel = interaction.options.getInteger('min_level') || 0;
        const minMessages = interaction.options.getInteger('min_messages') || 0;
        const minAccountAge = interaction.options.getInteger('min_account_age') || 0;
        const minServerAge = interaction.options.getInteger('min_server_age') || 0;
        const minInvites = interaction.options.getInteger('min_invites') || 0;

        // Parse duration
        const duration = ms(durationStr);
        if (!duration || duration < 60000 || duration > 2592000000) {
            return interaction.reply({
                embeds: [embedBuilder.error('Error', 'Invalid duration! Must be between 1 minute and 30 days.\nExample: 1d, 12h, 30m')],
                flags: MessageFlags.Ephemeral
            });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const options = {
            prize,
            description,
            duration,
            winnersCount,
            hostId: interaction.user.id,
            hostTag: interaction.user.tag,
            requirements: {
                requiredRoles: requiredRole ? [requiredRole.id] : [],
                minLevel,
                minMessages,
                minAccountAge,
                minServerAge,
                minInvites
            }
        };

        try {
            await client.giveawayHandler.createGiveaway(interaction.channel, options);

            await interaction.editReply({
                embeds: [embedBuilder.success('Giveaway Created',
                    `**${prize}** giveaway started!\n\n` +
                    `⏰ Duration: ${durationStr}\n` +
                    `🏆 Winners: ${winnersCount}\n` +
                    `${requiredRole ? `📋 Required Role: ${requiredRole}\n` : ''}` +
                    `${minLevel > 0 ? `📊 Min Level: ${minLevel}\n` : ''}` +
                    `${minMessages > 0 ? `💬 Min Messages: ${minMessages}\n` : ''}` +
                    `${minInvites > 0 ? `📨 Min Invites: ${minInvites} (Special Giveaway!)\n` : ''}`
                )]
            });
        } catch (error) {
            await interaction.editReply({
                embeds: [embedBuilder.error('Error', 'Failed to create giveaway!')]
            });
        }
    },

    async handleEnd(interaction, client) {
        const messageId = interaction.options.getString('message_id');

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const Giveaway = require('../../models/Giveaway');
        const giveaway = await Giveaway.findOne({ messageId, ended: false });

        if (!giveaway) {
            return interaction.editReply({
                embeds: [embedBuilder.error('Error', 'Active giveaway not found!')]
            });
        }

        await client.giveawayHandler.endGiveaway(giveaway);

        await interaction.editReply({
            embeds: [embedBuilder.success('Giveaway Ended', 'Giveaway ended early and winners have been selected!')]
        });
    },

    async handleReroll(interaction, client) {
        const messageId = interaction.options.getString('message_id');
        const count = interaction.options.getInteger('count') || 1;

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const result = await client.giveawayHandler.rerollGiveaway(messageId, count);

        if (!result.success) {
            return interaction.editReply({
                embeds: [embedBuilder.error('Error', result.message)]
            });
        }

        const winnerMentions = result.winners.map(id => `<@${id}>`).join(', ');

        await interaction.editReply({
            embeds: [embedBuilder.success('Reroll Complete',
                `New winners for **${result.prize}**:\n${winnerMentions}`
            )]
        });

        // Announce in channel
        await interaction.channel.send({
            content: `🎉 **Reroll!** Congratulations ${winnerMentions}! You won **${result.prize}**!`
        });
    },

    async handleList(interaction, client) {
        const Giveaway = require('../../models/Giveaway');
        const giveaways = await Giveaway.find({
            guildId: interaction.guild.id,
            ended: false
        }).sort({ endsAt: 1 });

        if (giveaways.length === 0) {
            return interaction.reply({
                embeds: [embedBuilder.info('Active Giveaways', 'No active giveaways at the moment!')],
                flags: MessageFlags.Ephemeral
            });
        }

        const list = giveaways.map((g, i) => {
            const endsAt = Math.floor(g.endsAt.getTime() / 1000);
            return `${i + 1}. **${g.prize}**\n└ Ends: <t:${endsAt}:R>\n└ Entries: ${g.entries.length}\n└ [Jump to Message](https://discord.com/channels/${g.guildId}/${g.channelId}/${g.messageId})`;
        }).join('\n\n');

        await interaction.reply({
            embeds: [embedBuilder.info('🎁 Active Giveaways', list)],
            flags: MessageFlags.Ephemeral
        });
    }
};
