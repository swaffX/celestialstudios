const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const embedBuilder = require('../../utils/embedBuilder');
const Guild = require('../../models/Guild');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setupsuggestions')
        .setDescription('Setup the suggestions system with category selection')
        .addRoleOption(option =>
            option.setName('review_role')
                .setDescription('Role that can view and review suggestions')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            const guild = interaction.guild;
            const reviewRole = interaction.options.getRole('review_role');

            // Create SUGGESTIONS category
            let suggestionsCategory = guild.channels.cache.find(
                c => c.type === ChannelType.GuildCategory && c.name.toUpperCase().includes('SUGGESTION')
            );

            if (!suggestionsCategory) {
                suggestionsCategory = await guild.channels.create({
                    name: '💡 SUGGESTIONS',
                    type: ChannelType.GuildCategory
                });
            }

            // Create panel channel (public - where users click button)
            let panelChannel = guild.channels.cache.find(
                c => c.name === 'suggest' && c.parentId === suggestionsCategory.id
            );

            if (!panelChannel) {
                panelChannel = await guild.channels.create({
                    name: '💡・suggest',
                    type: ChannelType.GuildText,
                    parent: suggestionsCategory.id,
                    topic: 'Click the button below to submit a suggestion!',
                    permissionOverwrites: [
                        {
                            id: guild.id,
                            deny: ['SendMessages'],
                            allow: ['ViewChannel', 'ReadMessageHistory']
                        },
                        {
                            id: interaction.client.user.id,
                            allow: ['SendMessages', 'ViewChannel', 'EmbedLinks']
                        }
                    ]
                });
            }

            // Create Server Suggestions channel (staff only)
            let serverSuggestionsChannel = guild.channels.cache.find(
                c => c.name === 'server-suggestions' && c.parentId === suggestionsCategory.id
            );

            if (!serverSuggestionsChannel) {
                serverSuggestionsChannel = await guild.channels.create({
                    name: '📋・server-suggestions',
                    type: ChannelType.GuildText,
                    parent: suggestionsCategory.id,
                    topic: 'Server improvement suggestions from members',
                    permissionOverwrites: [
                        {
                            id: guild.id,
                            deny: ['ViewChannel']
                        },
                        {
                            id: reviewRole.id,
                            allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'AddReactions']
                        },
                        {
                            id: interaction.client.user.id,
                            allow: ['SendMessages', 'ViewChannel', 'EmbedLinks', 'AddReactions']
                        }
                    ]
                });
            }

            // Create Skill Giveaway Suggestions channel (staff only)
            let skillGiveawayChannel = guild.channels.cache.find(
                c => c.name === 'skill-giveaway-suggestions' && c.parentId === suggestionsCategory.id
            );

            if (!skillGiveawayChannel) {
                skillGiveawayChannel = await guild.channels.create({
                    name: '🎁・skill-giveaway-suggestions',
                    type: ChannelType.GuildText,
                    parent: suggestionsCategory.id,
                    topic: 'Skill giveaway suggestions from members',
                    permissionOverwrites: [
                        {
                            id: guild.id,
                            deny: ['ViewChannel']
                        },
                        {
                            id: reviewRole.id,
                            allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'AddReactions']
                        },
                        {
                            id: interaction.client.user.id,
                            allow: ['SendMessages', 'ViewChannel', 'EmbedLinks', 'AddReactions']
                        }
                    ]
                });
            }

            // Save to database
            const guildSettings = await Guild.findOrCreate(guild.id);
            guildSettings.suggestions = {
                enabled: true,
                categoryId: suggestionsCategory.id,
                panelChannelId: panelChannel.id,
                serverSuggestionsChannelId: serverSuggestionsChannel.id,
                skillGiveawaySuggestionsChannelId: skillGiveawayChannel.id,
                reviewRoles: [reviewRole.id],
                counter: guildSettings.suggestions?.counter || 0
            };
            await guildSettings.save();

            // Create panel embed
            const panelEmbed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('💡 Suggestion Box')
                .setDescription(
                    `## Share Your Ideas!\n\n` +
                    `> Have a suggestion to improve our server?\n` +
                    `> Want to recommend a skill for giveaways?\n\n` +
                    `╭───────────────────────────╮\n\n` +
                    `**Categories:**\n` +
                    `> 📋 **Server Suggestions** - Ideas to improve the server\n` +
                    `> 🎁 **Skill Giveaway Suggestions** - Recommend skills for giveaways\n\n` +
                    `╰───────────────────────────╯\n\n` +
                    `Click the button below to submit your suggestion!`
                )

                .setFooter({ text: 'Your voice matters! 🌟', iconURL: guild.iconURL({ dynamic: true }) })
                .setTimestamp();

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('suggestion_create')
                        .setLabel('Submit Suggestion')
                        .setEmoji('💡')
                        .setStyle(ButtonStyle.Primary)
                );

            const panelMessage = await panelChannel.send({ embeds: [panelEmbed], components: [row] });

            // Update panel message ID
            guildSettings.suggestions.panelMessageId = panelMessage.id;
            await guildSettings.save();

            // Success response
            const successEmbed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setTitle('✅ Suggestions System Ready!')
                .setDescription(
                    `**Channels Created:**\n` +
                    `> 💡 Panel: ${panelChannel}\n` +
                    `> 📋 Server Suggestions: ${serverSuggestionsChannel}\n` +
                    `> 🎁 Skill Giveaway: ${skillGiveawayChannel}\n\n` +
                    `**Review Role:** ${reviewRole}\n\n` +
                    `Members can now click the button in ${panelChannel} to submit suggestions!`
                )
                .setFooter({ text: 'Suggestions system configured' })
                .setTimestamp();

            await interaction.editReply({ embeds: [successEmbed] });
            logger.info(`Suggestions system setup by ${interaction.user.tag}`);

        } catch (error) {
            logger.error('Setup suggestions error:', error);
            await interaction.editReply({
                embeds: [embedBuilder.error('Error', `Failed to setup suggestions: ${error.message}`)]
            });
        }
    }
};
