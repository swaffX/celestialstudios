const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder, MessageFlags } = require('discord.js');
const embedBuilder = require('../../utils/embedBuilder');
const Guild = require('../../models/Guild');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setupwelcome')
        .setDescription('Setup welcome system with auto channel creation')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('welcome_message')
                .setDescription('Custom welcome message ({user} = mention, {server} = server name, {count} = member count)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('farewell_message')
                .setDescription('Custom farewell message')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('banner_url')
                .setDescription('Welcome banner image URL')
                .setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            const guild = interaction.guild;
            const welcomeMessage = interaction.options.getString('welcome_message') || 'Welcome to **{server}**, {user}! You are member #{count}! 🎉';
            const farewellMessage = interaction.options.getString('farewell_message') || 'Goodbye **{username}**! We hope to see you again! 👋';
            const bannerUrl = interaction.options.getString('banner_url');

            // Create WELCOME category
            let welcomeCategory = guild.channels.cache.find(
                c => c.type === ChannelType.GuildCategory && c.name.toUpperCase().includes('WELCOME')
            );

            if (!welcomeCategory) {
                welcomeCategory = await guild.channels.create({
                    name: '👋 WELCOME',
                    type: ChannelType.GuildCategory,
                    position: 0
                });
            }

            // Create welcome channel
            let welcomeChannel = guild.channels.cache.find(
                c => c.name === 'welcome' && c.parentId === welcomeCategory.id
            );
            if (!welcomeChannel) {
                welcomeChannel = await guild.channels.create({
                    name: 'welcome',
                    type: ChannelType.GuildText,
                    parent: welcomeCategory.id,
                    topic: '👋 Welcome new members!'
                });
            }

            // Create farewell channel
            let farewellChannel = guild.channels.cache.find(
                c => c.name === 'farewell' && c.parentId === welcomeCategory.id
            );
            if (!farewellChannel) {
                farewellChannel = await guild.channels.create({
                    name: 'farewell',
                    type: ChannelType.GuildText,
                    parent: welcomeCategory.id,
                    topic: '👋 Goodbye messages'
                });
            }

            // Create invites channel
            let invitesChannel = guild.channels.cache.find(
                c => c.name === 'invites' && c.parentId === welcomeCategory.id
            );
            if (!invitesChannel) {
                invitesChannel = await guild.channels.create({
                    name: 'invites',
                    type: ChannelType.GuildText,
                    parent: welcomeCategory.id,
                    topic: '📨 Invite tracking notifications'
                });
            }

            // Save to database
            await Guild.findOneAndUpdate(
                { guildId: guild.id },
                {
                    'welcomeSystem.enabled': true,
                    'welcomeSystem.welcomeChannelId': welcomeChannel.id,
                    'welcomeSystem.farewellChannelId': farewellChannel.id,
                    'welcomeSystem.invitesChannelId': invitesChannel.id,
                    'welcomeSystem.categoryId': welcomeCategory.id,
                    'welcomeSystem.welcomeMessage': welcomeMessage,
                    'welcomeSystem.farewellMessage': farewellMessage,
                    'welcomeSystem.bannerUrl': bannerUrl || null
                },
                { upsert: true }
            );

            // Send setup info embed to welcome channel
            const setupEmbed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('👋 Welcome System Configured!')
                .setDescription(
                    `> This channel will display welcome messages.\n\n` +
                    `**Preview:**\n${welcomeMessage.replace('{user}', `<@${interaction.user.id}>`).replace('{server}', guild.name).replace('{count}', guild.memberCount)}`
                )
                .setFooter({ text: 'Welcome System • Active', iconURL: guild.iconURL({ dynamic: true }) })
                .setTimestamp();

            if (bannerUrl) setupEmbed.setImage(bannerUrl);
            await welcomeChannel.send({ embeds: [setupEmbed] });

            // Send info to invites channel
            const inviteEmbed = new EmbedBuilder()
                .setColor('#9b59b6')
                .setTitle('📨 Invite Tracking Active')
                .setDescription(
                    `> Invite notifications will appear here.\n\n` +
                    `When a member joins, you'll see who invited them!`
                )
                .setFooter({ text: 'Invite System • Active', iconURL: guild.iconURL({ dynamic: true }) })
                .setTimestamp();

            await invitesChannel.send({ embeds: [inviteEmbed] });

            const successEmbed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setTitle('✅ Welcome System Setup Complete!')
                .setDescription(
                    `**Channels Created:**\n` +
                    `> 👋 Welcome: ${welcomeChannel}\n` +
                    `> 👋 Farewell: ${farewellChannel}\n` +
                    `> 📨 Invites: ${invitesChannel}\n\n` +
                    `**Messages:**\n` +
                    `> Welcome: \`${welcomeMessage.substring(0, 50)}...\`\n` +
                    `> Farewell: \`${farewellMessage.substring(0, 50)}...\``
                )
                .setFooter({ text: 'All channels are under the WELCOME category' })
                .setTimestamp();

            await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            console.error('Setup welcome error:', error);
            await interaction.editReply({
                embeds: [embedBuilder.error('Error', `Failed to setup welcome system: ${error.message}`)]
            });
        }
    }
};
