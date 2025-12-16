const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const Guild = require('../../models/Guild');
const embedBuilder = require('../../utils/embedBuilder');
const logger = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setupmarketplace')
        .setDescription('Sets up the Community Hub (Hiring, Selling, Portfolios)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const guildSettings = await Guild.findOrCreate(interaction.guild.id);
            const guild = interaction.guild;

            // 1. Create Category
            let category = guild.channels.cache.find(c => c.name === 'COMMUNITY HUB' && c.type === ChannelType.GuildCategory);
            if (!category) {
                category = await guild.channels.create({
                    name: 'COMMUNITY HUB',
                    type: ChannelType.GuildCategory
                });
            }
            guildSettings.marketplace.category = category.id;

            // Helper to create channel if missing
            const createChannel = async (name, topic) => {
                let channel = guild.channels.cache.find(c => c.name === name && c.parentId === category.id);
                if (!channel) {
                    channel = await guild.channels.create({
                        name: name,
                        type: ChannelType.GuildText,
                        parent: category.id,
                        topic: topic,
                        permissionOverwrites: [
                            {
                                id: guild.id,
                                deny: ['SendMessages'], // Only bot sends entry message
                                allow: ['ViewChannel', 'ReadMessageHistory']
                            }
                        ]
                    });
                }
                return channel;
            };

            // 2. Create Channels
            const hiringChannel = await createChannel('hiring', 'Post job offers here.');
            const forHireChannel = await createChannel('for-hire', 'Looking for work? Post here.');
            const portfoliosChannel = await createChannel('portfolios', 'Showcase your work. One post per user.');
            const sellingChannel = await createChannel('selling', 'Sell your assets, scripts, or services here.');

            // Save IDs
            guildSettings.marketplace.hiring = hiringChannel.id;
            guildSettings.marketplace.forHire = forHireChannel.id;
            guildSettings.marketplace.portfolios = portfoliosChannel.id;
            guildSettings.marketplace.selling = sellingChannel.id;

            await guildSettings.save();

            // 3. Send "Create Post" Embeds to each channel

            // Generic Function to send Panel
            const sendPanel = async (channel, title, description, buttonLabel, buttonId, emoji, color, imageUrl) => {
                // Clear old messages (optional, simplistic approach)
                // In production, better to check if last message is bot's panel

                const embed = new EmbedBuilder()
                    .setColor(color)
                    .setTitle(title)
                    .setDescription(description)
                    .setImage(imageUrl)
                    .setFooter({ text: 'Celestial Studios Marketplace' });

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(buttonId)
                            .setLabel(buttonLabel)
                            .setStyle(ButtonStyle.Success)
                            .setEmoji(emoji)
                    );

                await channel.send({ embeds: [embed], components: [row] });
            };

            // Hiring
            await sendPanel(
                hiringChannel,
                '📢 Hiring - Find Talent',
                'Looking for developers, designers, or staff? Click the button below to create a job post.\n\n**Rules:**\n• Be clear about payment.\n• No unpaid work requests for complex tasks.\n• Scams will result in a ban.',
                'Post Job Offer',
                'marketplace_create_hiring',
                '💼',
                '#3498db',
                'https://geekflare.com/wp-content/uploads/2021/01/hiring-platform.png' // Placeholder or user's banner
            );

            // For Hire
            await sendPanel(
                forHireChannel,
                '👨‍💻 For Hire - Find Work',
                'Are you a freelancer looking for work? Create a profile here!\n\n**Tips:**\n• List your skills clearly.\n• Link your portfolio.\n• State your rates.',
                'Create For Hire Post',
                'marketplace_create_forhire',
                '🙋‍♂️',
                '#2ecc71',
                'https://www.betterteam.com/images/betterteam-hiring-freelancers-guide.jpg'
            );

            // Portfolios
            await sendPanel(
                portfoliosChannel,
                '🎨 Portfolios - Showcase',
                'Show off your best work here! Each user gets **one** portfolio post. You can edit it anytime.\n\nNOTE: This is for showing off, not direct selling.',
                'Create/Edit Portfolio',
                'marketplace_create_portfolio',
                '🖼️',
                '#9b59b6',
                'https://cdn.dribbble.com/users/60166/screenshots/15454558/media/64b584a275466c1b3595567784084534.jpg'
            );

            // Selling
            await sendPanel(
                sellingChannel,
                '🛒 Selling - Market',
                'Sell your Roblox assets, scripts, GUIs, or services.\n\n**Requirements:**\n• clearly state Price (Robux/USD).\n• significant proof of ownership required.\n• No blackmarket/stolen goods.',
                'Create Sales Post',
                'marketplace_create_selling',
                '💰',
                '#f1c40f',
                'https://i.ytimg.com/vi/bX7jB2LqgE8/maxresdefault.jpg' // Placeholder
            );

            await interaction.editReply({
                embeds: [embedBuilder.success('Marketplace Setup', 'Community Hub channels created and panels sent successfully!')]
            });

        } catch (error) {
            logger.error('Setup Marketplace error:', error);
            await interaction.editReply({
                embeds: [embedBuilder.error('Error', 'Failed to setup marketplace.')]
            });
        }
    }
};
