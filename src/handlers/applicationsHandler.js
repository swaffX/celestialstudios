const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const Guild = require('../models/Guild');
const logger = require('../utils/logger');

/**
 * Show application modal
 */
async function showApplicationModal(interaction) {
    const modal = new ModalBuilder()
        .setCustomId('application_modal')
        .setTitle('Staff Application');

    const ageInput = new TextInputBuilder()
        .setCustomId('app_age')
        .setLabel('How old are you?')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('e.g., 18')
        .setRequired(true)
        .setMaxLength(3);

    const timezoneInput = new TextInputBuilder()
        .setCustomId('app_timezone')
        .setLabel('Your timezone')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('e.g., UTC+3, EST, PST')
        .setRequired(true)
        .setMaxLength(20);

    const experienceInput = new TextInputBuilder()
        .setCustomId('app_experience')
        .setLabel('Previous staff/moderation experience')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Describe any previous experience...')
        .setRequired(true)
        .setMaxLength(1000);

    const whyInput = new TextInputBuilder()
        .setCustomId('app_why')
        .setLabel('Why do you want to join our team?')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Tell us your motivation...')
        .setRequired(true)
        .setMaxLength(1000);

    const availabilityInput = new TextInputBuilder()
        .setCustomId('app_availability')
        .setLabel('How many hours per day can you be active?')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('e.g., 3-4 hours')
        .setRequired(true)
        .setMaxLength(50);

    modal.addComponents(
        new ActionRowBuilder().addComponents(ageInput),
        new ActionRowBuilder().addComponents(timezoneInput),
        new ActionRowBuilder().addComponents(experienceInput),
        new ActionRowBuilder().addComponents(whyInput),
        new ActionRowBuilder().addComponents(availabilityInput)
    );

    await interaction.showModal(modal);
}

/**
 * Handle application submission
 */
async function handleApplicationSubmit(interaction) {
    const { fields, user, guild, member } = interaction;

    const age = fields.getTextInputValue('app_age');
    const timezone = fields.getTextInputValue('app_timezone');
    const experience = fields.getTextInputValue('app_experience');
    const why = fields.getTextInputValue('app_why');
    const availability = fields.getTextInputValue('app_availability');

    const guildSettings = await Guild.findOne({ guildId: guild.id });

    if (!guildSettings?.applications?.enabled) {
        return interaction.reply({
            content: '❌ Application system is not configured.',
            flags: MessageFlags.Ephemeral
        });
    }

    // Increment counter
    guildSettings.applications.counter = (guildSettings.applications.counter || 0) + 1;
    const appNumber = guildSettings.applications.counter;
    await guildSettings.save();

    try {
        const reviewChannel = await guild.channels.fetch(guildSettings.applications.reviewChannelId);

        if (!reviewChannel) {
            return interaction.reply({
                content: '❌ Review channel not found.',
                flags: MessageFlags.Ephemeral
            });
        }

        // Get user stats
        const User = require('../models/User');
        const userData = await User.findOne({ odasi: user.id, odaId: guild.id });

        const joinedAt = Math.floor(member.joinedTimestamp / 1000);
        const createdAt = Math.floor(user.createdTimestamp / 1000);

        // Create application embed
        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setAuthor({
                name: `📋 Application #${appNumber}`,
                iconURL: user.displayAvatarURL()
            })
            .setThumbnail(user.displayAvatarURL({ size: 256 }))
            .setDescription(
                `## New Staff Application\n\n` +
                `**Applicant:** ${user} (\`${user.tag}\`)\n` +
                `**User ID:** \`${user.id}\`\n\n` +
                `╭───────────────────────────╮`
            )
            .addFields(
                { name: '🎂 Age', value: `\`${age}\``, inline: true },
                { name: '🌍 Timezone', value: `\`${timezone}\``, inline: true },
                { name: '⏰ Availability', value: `\`${availability}\``, inline: true },
                { name: '📅 Account Created', value: `<t:${createdAt}:R>`, inline: true },
                { name: '📥 Joined Server', value: `<t:${joinedAt}:R>`, inline: true },
                { name: '📊 Level', value: `\`${userData?.level || 0}\``, inline: true },
                { name: '💼 Experience', value: experience.substring(0, 1024) },
                { name: '❓ Why Join', value: why.substring(0, 1024) }
            )
            .setFooter({ text: `Application ID: #${appNumber}` })
            .setTimestamp();

        // Action buttons
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`app_accept_${user.id}_${appNumber}`)
                    .setLabel('Accept')
                    .setEmoji('✅')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`app_reject_${user.id}_${appNumber}`)
                    .setLabel('Reject')
                    .setEmoji('❌')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId(`app_interview_${user.id}_${appNumber}`)
                    .setLabel('Interview')
                    .setEmoji('💬')
                    .setStyle(ButtonStyle.Primary)
            );

        await reviewChannel.send({ embeds: [embed], components: [row] });

        // Confirm to user
        await interaction.reply({
            content: `✅ Your application has been submitted! (Application #${appNumber})\n\nWe will review it and get back to you soon. Good luck! 🍀`,
            flags: MessageFlags.Ephemeral
        });

        logger.info(`Application #${appNumber} submitted by ${user.tag}`);

    } catch (error) {
        logger.error('Failed to submit application:', error);
        await interaction.reply({
            content: '❌ Failed to submit application. Please try again.',
            flags: MessageFlags.Ephemeral
        });
    }
}

/**
 * Handle application decision (accept/reject/interview)
 */
async function handleApplicationDecision(interaction, action, odasi, appNumber) {
    const { guild, user: reviewer } = interaction;

    const guildSettings = await Guild.findOne({ guildId: guild.id });

    if (!guildSettings?.applications?.enabled) {
        return interaction.reply({
            content: '❌ Application system is not configured.',
            flags: MessageFlags.Ephemeral
        });
    }

    try {
        const applicant = await guild.members.fetch(odasi).catch(() => null);

        if (!applicant) {
            // Update embed to show user left
            const originalEmbed = interaction.message.embeds[0];
            const updatedEmbed = EmbedBuilder.from(originalEmbed)
                .setColor('#95a5a6')
                .setFooter({ text: '⚠️ Applicant left the server' });

            await interaction.update({ embeds: [updatedEmbed], components: [] });
            return;
        }

        let resultEmbed;
        let dmMessage;

        if (action === 'accept') {
            // Give role
            const staffRole = guildSettings.applications.acceptedRoleId;
            if (staffRole) {
                await applicant.roles.add(staffRole).catch(() => null);
            }

            resultEmbed = EmbedBuilder.from(interaction.message.embeds[0])
                .setColor('#2ecc71')
                .setFooter({ text: `✅ Accepted by ${reviewer.tag} • Application #${appNumber}` });

            dmMessage = `🎉 **Congratulations!** Your staff application for **${guild.name}** has been accepted!\n\nWelcome to the team!`;

        } else if (action === 'reject') {
            resultEmbed = EmbedBuilder.from(interaction.message.embeds[0])
                .setColor('#e74c3c')
                .setFooter({ text: `❌ Rejected by ${reviewer.tag} • Application #${appNumber}` });

            dmMessage = `Thank you for applying to **${guild.name}**.\n\nUnfortunately, your application was not accepted at this time. Feel free to apply again in the future!`;

        } else if (action === 'interview') {
            resultEmbed = EmbedBuilder.from(interaction.message.embeds[0])
                .setColor('#f1c40f')
                .setFooter({ text: `💬 Interview requested by ${reviewer.tag} • Application #${appNumber}` });

            dmMessage = `📋 Your staff application for **${guild.name}** is being reviewed!\n\nA staff member would like to interview you. Please wait for them to contact you.`;
        }

        // Update the embed
        await interaction.update({ embeds: [resultEmbed], components: [] });

        // DM the applicant
        try {
            await applicant.send(dmMessage);
        } catch (e) {
            // DMs might be closed
            logger.warn(`Could not DM applicant ${applicant.user.tag}`);
        }

        logger.info(`Application #${appNumber} ${action}ed by ${reviewer.tag}`);

    } catch (error) {
        logger.error('Failed to process application decision:', error);
        await interaction.reply({
            content: '❌ Failed to process decision.',
            flags: MessageFlags.Ephemeral
        });
    }
}

module.exports = { showApplicationModal, handleApplicationSubmit, handleApplicationDecision };
