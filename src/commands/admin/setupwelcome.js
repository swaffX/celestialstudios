const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder, MessageFlags } = require('discord.js');
const embedBuilder = require('../../utils/embedBuilder');
const Guild = require('../../models/Guild');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setupwelcome')
        .setDescription('Setup welcome system (auto-creates channels with premium embeds)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            const guild = interaction.guild;

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
                    'welcomeSystem.categoryId': welcomeCategory.id
                },
                { upsert: true }
            );

            // Send setup confirmation to welcome channel
            const setupEmbed = new EmbedBuilder()
                .setColor('#43B581')
                .setTitle('✅ Welcome System Active')
                .setDescription(
                    `> Premium welcome embeds are now active!\n\n` +
                    `When someone joins, they'll see a beautiful embed with:\n` +
                    `• Their avatar & username\n` +
                    `• Account age\n` +
                    `• Member count\n` +
                    `• Custom banner`
                )
                .setImage('https://cdn.discordapp.com/attachments/531892263652032522/1450318087948603486/Gemini_Generated_Image_mhflenmhflenmhfl.png')
                .setFooter({ text: 'Welcome System • Configured', iconURL: guild.iconURL({ dynamic: true }) })
                .setTimestamp();

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
                .setTitle('✅ Welcome System Ready!')
                .setDescription(
                    `**Channels Created:**\n` +
                    `> 👋 Welcome: ${welcomeChannel}\n` +
                    `> 👋 Farewell: ${farewellChannel}\n` +
                    `> 📨 Invites: ${invitesChannel}\n\n` +
                    `**Features:**\n` +
                    `> ✨ Premium welcome embeds\n` +
                    `> ✨ Farewell embeds\n` +
                    `> ✨ Invite tracking\n` +
                    `> ✨ Member count display`
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
