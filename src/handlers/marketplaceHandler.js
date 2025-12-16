const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ChannelType, MessageFlags } = require('discord.js');
const Guild = require('../models/Guild');
const logger = require('../utils/logger');

// Helper to show modal
const showModal = async (interaction, type) => {
    let modalId, title, inputs;

    switch (type) {
        case 'hiring':
            modalId = 'modal_mpl_hiring';
            title = 'Post Job Offer';
            inputs = [
                { id: 'job_title', label: 'Job Title', style: TextInputStyle.Short, placeholder: 'e.g., LUA Scripter Needed', required: true, max: 50 },
                { id: 'job_payment', label: 'Payment', style: TextInputStyle.Short, placeholder: 'e.g., 5000 Robux / $50 USD', required: true, max: 100 },
                { id: 'job_desc', label: 'Job Description', style: TextInputStyle.Paragraph, placeholder: 'Describe the task...', required: true, max: 1000 },
                { id: 'job_req', label: 'Requirements', style: TextInputStyle.Paragraph, placeholder: 'List skills needed...', required: false, max: 500 }
            ];
            break;
        case 'forhire':
            modalId = 'modal_mpl_forhire';
            title = 'Create For Hire Profile';
            inputs = [
                { id: 'hire_skills', label: 'Skills', style: TextInputStyle.Short, placeholder: 'e.g., Builder, UI Designer', required: true, max: 100 },
                { id: 'hire_rates', label: 'Rates', style: TextInputStyle.Short, placeholder: 'e.g., 1000 Robux', required: true, max: 100 },
                { id: 'hire_experience', label: 'Experience', style: TextInputStyle.Paragraph, placeholder: 'About your experience...', required: true, max: 1000 },
                { id: 'hire_portfolio', label: 'Portfolio Link (Optional)', style: TextInputStyle.Short, placeholder: 'https://...', required: false, max: 200 }
            ];
            break;
        case 'portfolio':
            modalId = 'modal_mpl_portfolio';
            title = 'Update Portfolio';
            inputs = [
                { id: 'port_title', label: 'Portfolio Title', style: TextInputStyle.Short, placeholder: 'Title of your showcase', required: true, max: 50 },
                { id: 'port_desc', label: 'Description', style: TextInputStyle.Paragraph, placeholder: 'Describe your work...', required: true, max: 1000 },
                { id: 'port_links', label: 'Links', style: TextInputStyle.Paragraph, placeholder: 'Links to your work...', required: true, max: 500 }
            ];
            break;
        case 'selling':
            modalId = 'modal_mpl_selling';
            title = 'Create Sales Post';
            inputs = [
                { id: 'sell_item', label: 'Item Name', style: TextInputStyle.Short, placeholder: 'e.g., Map Pack', required: true, max: 50 },
                { id: 'sell_price', label: 'Price', style: TextInputStyle.Short, placeholder: 'e.g., 500 Robux', required: true, max: 50 },
                { id: 'sell_desc', label: 'Description', style: TextInputStyle.Paragraph, placeholder: 'Item details...', required: true, max: 1000 }
            ];
            break;
    }

    const modal = new ModalBuilder().setCustomId(modalId).setTitle(title);
    for (const input of inputs) {
        modal.addComponents(new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId(input.id)
                .setLabel(input.label)
                .setStyle(input.style)
                .setPlaceholder(input.placeholder)
                .setRequired(input.required)
                .setMaxLength(input.max)
        ));
    }
    await interaction.showModal(modal);
};

// Handle Submissions
const handleSubmission = async (interaction, client) => {
    const { customId, fields, user, guild } = interaction;
    const guildSettings = await Guild.findOne({ guildId: guild.id });
    if (!guildSettings?.marketplace) return;

    let channelId, embed, typeLabel;

    // Construct Embed based on type
    if (customId === 'modal_mpl_hiring') {
        channelId = guildSettings.marketplace.hiring;
        typeLabel = 'HIRING';
        embed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle(`💼 ${fields.getTextInputValue('job_title')}`)
            .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
            .addFields(
                { name: '💰 Payment', value: fields.getTextInputValue('job_payment'), inline: true },
                { name: '👤 Employer', value: `${user}`, inline: true },
                { name: '📝 Description', value: fields.getTextInputValue('job_desc') },
                { name: '📋 Requirements', value: fields.getTextInputValue('job_req') || 'None' }
            )
            .setFooter({ text: 'DM user to apply!' }).setTimestamp();

    } else if (customId === 'modal_mpl_forhire') {
        channelId = guildSettings.marketplace.forHire;
        typeLabel = 'FOR HIRE';
        embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle(`👨‍💻 For Hire: ${user.username}`)
            .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
            .setDescription(fields.getTextInputValue('hire_experience'))
            .addFields(
                { name: '🛠️ Skills', value: fields.getTextInputValue('hire_skills'), inline: true },
                { name: '💵 Rates', value: fields.getTextInputValue('hire_rates'), inline: true }
            );
        const port = fields.getTextInputValue('hire_portfolio');
        if (port) embed.addFields({ name: '🔗 Portfolio', value: port });
        embed.setFooter({ text: 'DM user to hire!' }).setTimestamp();

    } else if (customId === 'modal_mpl_portfolio') {
        channelId = guildSettings.marketplace.portfolios;
        typeLabel = 'PORTFOLIO';
        embed = new EmbedBuilder()
            .setColor('#9b59b6')
            .setTitle(`🎨 ${user.username}'s Portfolio: ${fields.getTextInputValue('port_title')}`)
            .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
            .setDescription(fields.getTextInputValue('port_desc'))
            .addFields({ name: '🔗 Links', value: fields.getTextInputValue('port_links') })
            .setTimestamp();

    } else if (customId === 'modal_mpl_selling') {
        channelId = guildSettings.marketplace.selling;
        typeLabel = 'SELLING';
        embed = new EmbedBuilder()
            .setColor('#f1c40f')
            .setTitle(`🛒 Selling: ${fields.getTextInputValue('sell_item')}`)
            .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
            .addFields(
                { name: '💵 Price', value: fields.getTextInputValue('sell_price'), inline: true },
                { name: '👤 Seller', value: `${user}`, inline: true },
                { name: '📦 Description', value: fields.getTextInputValue('sell_desc') }
            )
            .setFooter({ text: 'DM user to purchase!' }).setTimestamp();
    }

    if (!channelId) return;

    // Initiate DM Flow for Image/Video
    try {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        // Create DM
        const dmChannel = await user.createDM();

        // Send instructions
        await dmChannel.send({
            content: `**${typeLabel} Creation**\n\n📝 Details received!\n🖼️ **Upload an Image or Video** now to attach it to your post.\n➡️ Type \`skip\` to post without media.\n❌ Type \`cancel\` to cancel.`,
            embeds: [embed]
        });

        // Notify user in interaction
        await interaction.editReply({ content: '✅ Check your DMs to complete the post! (Please open DMs if closed)' });

        // Collect response
        const collector = dmChannel.createMessageCollector({
            filter: m => m.author.id === user.id,
            time: 120000,
            max: 1
        });

        collector.on('collect', async (msg) => {
            if (msg.content.toLowerCase() === 'cancel' || msg.content.toLowerCase() === 'iptal') {
                await user.send('❌ Post cancelled.');
                return;
            }

            const files = [];
            if (msg.attachments.size > 0) {
                files.push(msg.attachments.first());
            }

            try {
                const targetChannel = await client.channels.fetch(channelId);
                const payload = { content: `New ${typeLabel} post by ${user}`, embeds: [embed] };
                if (files.length > 0) {
                    payload.files = files;
                }

                await targetChannel.send(payload);
                await user.send(`✅ Your **${typeLabel}** post is live in ${targetChannel}!`);
                logger.info(`Marketplace post created by ${user.tag} (Type: ${typeLabel})`);

            } catch (err) {
                logger.error('Failed to post to marketplace:', err);
                await user.send('❌ Error posting to the server. Please check bot permissions.');
            }
        });

        collector.on('end', (collected, reason) => {
            if (reason === 'time' && collected.size === 0) {
                user.send('⏰ Time expired. Post cancelled.');
            }
        });

    } catch (error) {
        logger.error('DM Error in marketplace:', error);
        if (interaction.deferred) {
            await interaction.editReply({ content: '❌ Failed to DM you. Please open your DMs to upload media.' });
        } else {
            await interaction.reply({ content: '❌ Failed to DM you. Please open your DMs to upload media.', flags: MessageFlags.Ephemeral });
        }
    }
};

module.exports = { showModal, handleSubmission };
