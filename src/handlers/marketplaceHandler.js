const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ChannelType, MessageFlags } = require('discord.js');
const Guild = require('../models/Guild');
const logger = require('../utils/logger');
const embedBuilder = require('../utils/embedBuilder');
const User = require('../models/User'); // For tracking last post time or portfolio existence if needed

// Helper to show modal
const showModal = async (interaction, type) => {
    let modalId, title, inputs;

    switch (type) {
        case 'hiring':
            modalId = 'modal_mpl_hiring';
            title = 'Post Job Offer';
            inputs = [
                { id: 'job_title', label: 'Job Title', style: TextInputStyle.Short, placeholder: 'e.g., LUA Scripter Needed', required: true, max: 50 },
                { id: 'job_payment', label: 'Payment (Be Specific)', style: TextInputStyle.Short, placeholder: 'e.g., 5000 Robux / $50 USD', required: true, max: 100 },
                { id: 'job_desc', label: 'Job Description', style: TextInputStyle.Paragraph, placeholder: 'Describe the tasks...', required: true, max: 1000 },
                { id: 'job_req', label: 'Requirements', style: TextInputStyle.Paragraph, placeholder: 'List skills needed...', required: false, max: 500 }
            ];
            break;
        case 'forhire':
            modalId = 'modal_mpl_forhire';
            title = 'Create For Hire Profile';
            inputs = [
                { id: 'hire_skills', label: 'Core Skills', style: TextInputStyle.Short, placeholder: 'e.g., Builder, VFX Artist', required: true, max: 100 },
                { id: 'hire_rates', label: 'Rates / Pricing', style: TextInputStyle.Short, placeholder: 'e.g., Starting at 1000 Robux', required: true, max: 100 },
                { id: 'hire_experience', label: 'Experience / About You', style: TextInputStyle.Paragraph, placeholder: 'I have been building for 2 years...', required: true, max: 1000 },
                { id: 'hire_portfolio', label: 'Portfolio Link (Optional)', style: TextInputStyle.Short, placeholder: 'https://...', required: false, max: 200 }
            ];
            break;
        case 'portfolio':
            modalId = 'modal_mpl_portfolio';
            title = 'Update Portfolio';
            inputs = [
                { id: 'port_title', label: 'Portfolio Title', style: TextInputStyle.Short, placeholder: 'e.g., Best UI Designs 2024', required: true, max: 50 },
                { id: 'port_desc', label: 'Description', style: TextInputStyle.Paragraph, placeholder: 'Details about your work...', required: true, max: 1000 },
                { id: 'port_links', label: 'Links (Talent Hub, DevForum)', style: TextInputStyle.Paragraph, placeholder: 'List your links here...', required: true, max: 500 },
                { id: 'port_image', label: 'Direct Image Link (Optional)', style: TextInputStyle.Short, placeholder: 'https://i.imgur.com/... (Must be valid URL)', required: false, max: 200 }
            ];
            break;
        case 'selling':
            modalId = 'modal_mpl_selling';
            title = 'Create Sales Post';
            inputs = [
                { id: 'sell_item', label: 'Item Name', style: TextInputStyle.Short, placeholder: 'e.g., Sci-Fi Gun Pack', required: true, max: 50 },
                { id: 'sell_price', label: 'Price (Robux / USD)', style: TextInputStyle.Short, placeholder: 'e.g., 500 R$', required: true, max: 50 },
                { id: 'sell_desc', label: 'Description', style: TextInputStyle.Paragraph, placeholder: 'What does it include?', required: true, max: 1000 },
                { id: 'sell_preview', label: 'Preview Image/Video Link', style: TextInputStyle.Short, placeholder: 'https://...', required: true, max: 200 }
            ];
            break;
    }

    const modal = new ModalBuilder().setCustomId(modalId).setTitle(title);

    // Add components
    for (const input of inputs) {
        const component = new TextInputBuilder()
            .setCustomId(input.id)
            .setLabel(input.label)
            .setStyle(input.style)
            .setPlaceholder(input.placeholder)
            .setRequired(input.required);

        if (input.max) component.setMaxLength(input.max);

        modal.addComponents(new ActionRowBuilder().addComponents(component));
    }

    await interaction.showModal(modal);
};

// Handle Submissions
const handleSubmission = async (interaction, client) => {
    const { customId, fields, user, guild } = interaction;
    const guildSettings = await Guild.findOne({ guildId: guild.id });

    if (!guildSettings?.marketplace) return; // Logic missing if settings gone

    let channelId, embed, typeLabel;

    if (customId === 'modal_mpl_hiring') {
        channelId = guildSettings.marketplace.hiring;
        typeLabel = 'HIRING';

        const title = fields.getTextInputValue('job_title');
        const payment = fields.getTextInputValue('job_payment');
        const desc = fields.getTextInputValue('job_desc');
        const req = fields.getTextInputValue('job_req');

        embed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle(`💼 ${title}`)
            .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
            .addFields(
                { name: '💰 Payment', value: payment, inline: true },
                { name: '👤 Employer', value: `${user}`, inline: true },
                { name: '📝 Description', value: desc },
                { name: '📋 Requirements', value: req || 'None specified' }
            )
            .setFooter({ text: 'DM user to apply!' })
            .setTimestamp();

    } else if (customId === 'modal_mpl_forhire') {
        channelId = guildSettings.marketplace.forHire;
        typeLabel = 'FOR HIRE';

        const skills = fields.getTextInputValue('hire_skills');
        const rates = fields.getTextInputValue('hire_rates');
        const exp = fields.getTextInputValue('hire_experience');
        const port = fields.getTextInputValue('hire_portfolio');

        embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle(`👨‍💻 For Hire: ${user.username}`)
            .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
            .setDescription(exp)
            .addFields(
                { name: '🛠️ Skills', value: skills, inline: true },
                { name: '💵 Rates', value: rates, inline: true }
            );

        if (port) embed.addFields({ name: '🔗 Portfolio', value: port });
        embed.setFooter({ text: 'DM user to hire!' }).setTimestamp();

    } else if (customId === 'modal_mpl_portfolio') {
        channelId = guildSettings.marketplace.portfolios;
        typeLabel = 'PORTFOLIO';

        const title = fields.getTextInputValue('port_title');
        const desc = fields.getTextInputValue('port_desc');
        const links = fields.getTextInputValue('port_links');
        const image = fields.getTextInputValue('port_image');

        embed = new EmbedBuilder()
            .setColor('#9b59b6')
            .setTitle(`🎨 ${user.username}'s Portfolio: ${title}`)
            .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
            .setDescription(desc)
            .addFields({ name: '🔗 Links', value: links });

        if (image && (image.startsWith('http') || image.startsWith('https'))) {
            embed.setImage(image);
        }
        embed.setTimestamp();

        // Check for existing portfolio (simple deletion or edit logic)
        // For simplicity, we just send a new one. Advanced: search messages by author ID.

    } else if (customId === 'modal_mpl_selling') {
        channelId = guildSettings.marketplace.selling;
        typeLabel = 'SELLING';

        const item = fields.getTextInputValue('sell_item');
        const price = fields.getTextInputValue('sell_price');
        const desc = fields.getTextInputValue('sell_desc');
        const preview = fields.getTextInputValue('sell_preview');

        embed = new EmbedBuilder()
            .setColor('#f1c40f')
            .setTitle(`🛒 Selling: ${item}`)
            .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
            .addFields(
                { name: '💵 Price', value: price, inline: true },
                { name: '👤 Seller', value: `${user}`, inline: true },
                { name: '📦 Description', value: desc }
            )
            .setFooter({ text: 'DM user to purchase!' })
            .setTimestamp();

        if (preview && (preview.startsWith('http') || preview.startsWith('https'))) {
            embed.setImage(preview);
        } else {
            embed.addFields({ name: '👁️ Preview', value: preview });
        }
    }

    // Send Message
    if (channelId) {
        try {
            const channel = await guild.channels.fetch(channelId);
            if (channel) {
                await channel.send({ content: `New ${typeLabel} post by ${user}`, embeds: [embed] });
                await interaction.reply({ content: `✅ Your ${typeLabel} post has been published!`, flags: MessageFlags.Ephemeral });
                return;
            }
        } catch (err) {
            logger.error(`Failed to send ${typeLabel} post:`, err);
        }
    }

    await interaction.reply({ content: '❌ Failed to publish post. System error.', flags: MessageFlags.Ephemeral });
};

module.exports = { showModal, handleSubmission };
