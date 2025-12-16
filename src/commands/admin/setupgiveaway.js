const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const embedBuilder = require('../../utils/embedBuilder');
const Guild = require('../../models/Guild');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setupgiveaway')
        .setDescription('Setup giveaway system (auto-creates category & channel)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            const guild = interaction.guild;

            // Create GIVEAWAY category with emoji
            let giveawayCategory = guild.channels.cache.find(
                c => c.type === ChannelType.GuildCategory && c.name.toUpperCase().includes('GIVEAWAY')
            );

            if (!giveawayCategory) {
                giveawayCategory = await guild.channels.create({
                    name: '🎁 GIVEAWAYS',
                    type: ChannelType.GuildCategory
                });
            }

            // Create giveaway channel
            let giveawayChannel = guild.channels.cache.find(
                c => c.name.includes('giveaway') && c.parentId === giveawayCategory.id
            );

            if (!giveawayChannel) {
                giveawayChannel = await guild.channels.create({
                    name: '🎉・giveaways',
                    type: ChannelType.GuildText,
                    parent: giveawayCategory.id,
                    topic: '🎁 Server giveaways - Only staff can post here!',
                    permissionOverwrites: [
                        {
                            id: guild.id, // @everyone
                            deny: ['SendMessages'],
                            allow: ['ViewChannel', 'ReadMessageHistory', 'AddReactions']
                        },
                        {
                            id: interaction.client.user.id, // Bot
                            allow: ['SendMessages', 'ViewChannel', 'EmbedLinks', 'AddReactions', 'ManageMessages']
                        }
                    ]
                });
            }

            // Save to database
            const guildSettings = await Guild.findOrCreate(guild.id);
            guildSettings.giveawayChannel = giveawayChannel.id;
            await guildSettings.save();

            // Send info embed to giveaway channel
            const infoEmbed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('🎁 Giveaway Channel')
                .setDescription(
                    `## Welcome to Giveaways!\n\n` +
                    `> All server giveaways will be posted here.\n` +
                    `> Click the **🎉 Enter** button to participate!\n\n` +
                    `╭───────────────────────────╮\n` +
                    `**How it works:**\n` +
                    `• Staff creates giveaway with \`/giveaway create\`\n` +
                    `• Members click Enter button\n` +
                    `• Winner is announced automatically!\n` +
                    `╰───────────────────────────╯`
                )
                .setImage('https://i.imgur.com/wSTFkRM.png')
                .setFooter({ text: 'Good luck! 🍀', iconURL: guild.iconURL({ dynamic: true }) })
                .setTimestamp();

            await giveawayChannel.send({ embeds: [infoEmbed] });

            // Success response
            const successEmbed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setTitle('✅ Giveaway System Ready!')
                .setDescription(
                    `**Created:**\n` +
                    `> 📁 Category: **${giveawayCategory.name}**\n` +
                    `> 🎉 Channel: ${giveawayChannel}\n\n` +
                    `**Permissions:**\n` +
                    `> ❌ Members cannot send messages\n` +
                    `> ✅ Members can view & react\n` +
                    `> ✅ Bot can manage giveaways\n\n` +
                    `**Usage:**\n` +
                    `> Use \`/giveaway create\` to start a giveaway!`
                )
                .setFooter({ text: 'Giveaway system configured successfully' })
                .setTimestamp();

            await interaction.editReply({ embeds: [successEmbed] });

            logger.info(`Giveaway system setup by ${interaction.user.tag} in ${guild.name}`);

        } catch (error) {
            logger.error('Setup giveaway error:', error);
            await interaction.editReply({
                embeds: [embedBuilder.error('Error', `Failed to setup giveaway system: ${error.message}`)]
            });
        }
    }
};
