const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, StringSelectMenuBuilder, MessageFlags } = require('discord.js');
const Guild = require('../models/Guild');
const logger = require('../utils/logger');

/**
 * Show category selection menu
 */
async function showCategorySelect(interaction) {
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('suggestion_category_select')
        .setPlaceholder('Select suggestion category...')
        .addOptions([
            {
                label: 'Server Suggestions',
                description: 'Ideas to improve the server',
                value: 'server',
                emoji: '📋'
            },
            {
                label: 'Skill Giveaway Suggestions',
                description: 'Recommend skills for giveaways',
                value: 'skill_giveaway',
                emoji: '🎁'
            }
        ]);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('💡 Select Category')
        .setDescription('What type of suggestion would you like to make?')
        .setFooter({ text: 'Choose a category to continue' });

    await interaction.reply({
        embeds: [embed],
        components: [row],
        flags: MessageFlags.Ephemeral
    });
}

/**
 * Show suggestion modal for selected category
 */
async function showSuggestionModal(interaction, category) {
    const categoryLabel = category === 'server' ? 'Server Suggestion' : 'Skill Giveaway Suggestion';

    const modal = new ModalBuilder()
        .setCustomId(`suggestion_modal_${category}`)
        .setTitle(categoryLabel);

    const titleInput = new TextInputBuilder()
        .setCustomId('suggestion_title')
        .setLabel('Suggestion Title')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Brief title for your suggestion')
        .setRequired(true)
        .setMaxLength(100);

    const descriptionInput = new TextInputBuilder()
        .setCustomId('suggestion_description')
        .setLabel('Description')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Describe your suggestion in detail...')
        .setRequired(true)
        .setMaxLength(2000);

    modal.addComponents(
        new ActionRowBuilder().addComponents(titleInput),
        new ActionRowBuilder().addComponents(descriptionInput)
    );

    await interaction.showModal(modal);
}

/**
 * Handle suggestion submission
 */
async function handleSuggestionSubmit(interaction, category) {
    const { fields, user, guild } = interaction;

    const title = fields.getTextInputValue('suggestion_title');
    const description = fields.getTextInputValue('suggestion_description');

    const guildSettings = await Guild.findOne({ guildId: guild.id });

    if (!guildSettings?.suggestions?.enabled) {
        return interaction.reply({
            content: '❌ Suggestions system is not configured.',
            flags: MessageFlags.Ephemeral
        });
    }

    // Increment counter
    guildSettings.suggestions.counter = (guildSettings.suggestions.counter || 0) + 1;
    const suggestionNumber = guildSettings.suggestions.counter;
    await guildSettings.save();

    // Determine target channel
    const channelId = category === 'server'
        ? guildSettings.suggestions.serverSuggestionsChannelId
        : guildSettings.suggestions.skillGiveawaySuggestionsChannelId;

    const categoryLabel = category === 'server' ? 'Server Suggestion' : 'Skill Giveaway Suggestion';
    const categoryEmoji = category === 'server' ? '📋' : '🎁';
    const categoryColor = category === 'server' ? '#3498db' : '#e74c3c';

    try {
        const channel = await guild.channels.fetch(channelId);

        if (!channel) {
            return interaction.reply({
                content: '❌ Suggestions channel not found.',
                flags: MessageFlags.Ephemeral
            });
        }

        // Create suggestion embed
        const embed = new EmbedBuilder()
            .setColor(categoryColor)
            .setAuthor({
                name: `${categoryEmoji} ${categoryLabel} #${suggestionNumber}`,
                iconURL: user.displayAvatarURL()
            })
            .setTitle(title)
            .setDescription(
                `> ${description}\n\n` +
                `╭───────────────────────────╮`
            )
            .addFields(
                { name: '👤 Submitted By', value: `${user} (\`${user.tag}\`)`, inline: true },
                { name: '📅 Date', value: `<t:${Math.floor(Date.now() / 1000)}:f>`, inline: true },
                { name: '🔢 ID', value: `\`#${suggestionNumber}\``, inline: true }
            )
            .setFooter({ text: 'React to vote! ✅ Approve | ❌ Reject | 💬 Discuss' })
            .setTimestamp();

        const message = await channel.send({ embeds: [embed] });

        // Add reaction options
        await message.react('✅');
        await message.react('❌');
        await message.react('💬');

        // Confirm to user
        await interaction.reply({
            content: `✅ Your ${categoryLabel.toLowerCase()} has been submitted! (ID: #${suggestionNumber})`,
            flags: MessageFlags.Ephemeral
        });

        logger.info(`Suggestion #${suggestionNumber} submitted by ${user.tag} (${category})`);

    } catch (error) {
        logger.error('Failed to submit suggestion:', error);
        await interaction.reply({
            content: '❌ Failed to submit suggestion. Please try again.',
            flags: MessageFlags.Ephemeral
        });
    }
}

module.exports = { showCategorySelect, showSuggestionModal, handleSuggestionSubmit };
