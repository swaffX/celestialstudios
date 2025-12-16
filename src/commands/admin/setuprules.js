const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const embedBuilder = require('../../utils/embedBuilder');

const RULES_BANNER = 'https://cdn.discordapp.com/attachments/531892263652032522/1448020593336254594/Gemini_Generated_Image_i8jr95i8jr95i8jr.png';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setuprules')
        .setDescription('Create server rules embed')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            const rulesEmbed = new EmbedBuilder()
                .setColor('#2B2D31')
                .setAuthor({
                    name: interaction.guild.name.toUpperCase(),
                    iconURL: interaction.guild.iconURL({ dynamic: true })
                })
                .setTitle('📜 Server Rules')

                .addFields(
                    {
                        name: '📋 General Conduct',
                        value: '`1.` Be respectful to all members.\n`2.` No hate speech, harassment, or discrimination.\n`3.` No NSFW content (Zero Tolerance).\n`4.` No advertising without permission.\n`5.` Staff decisions are final.',
                        inline: false
                    },
                    {
                        name: '💬 Chat & Voice',
                        value: '• No spamming, flooding, or excessive caps.\n• Use correct channels for your topics.\n• No mic spam, loud noises, or soundboard abuse.\n• Respect others in voice channels.',
                        inline: true
                    },
                    {
                        name: '🛡️ Security',
                        value: '• No malicious links or crashing GIFs.\n• No sharing of personal information (Doxxing).\n• Report bugs/exploits, do not abuse them.',
                        inline: true
                    },
                    {
                        name: '⚠️ Consequences',
                        value: '`Tier 1:` Verbal Warning\n`Tier 2:` Timeout / Mute\n`Tier 3:` Kick from Server\n`Tier 4:` Permanent Ban',
                        inline: false
                    },
                    {
                        name: '🚨 IMPORTANT ASSET RULES',
                        value: '```diff\n- LEAKING OF PAID ASSETS IS STRICTLY PROHIBITED\n- ANY ATTEMPT WILL RESULT IN AN INSTANT BAN\n```',
                        inline: false
                    },
                    {
                        name: '📜 Terms of Service',
                        value: '🔗 [Discord ToS](https://discord.com/terms) • [Community Guidelines](https://discord.com/guidelines)',
                        inline: false
                    }
                )
                .setImage(RULES_BANNER)
                .setFooter({
                    text: '⚖️ Staff decisions are final • Last updated',
                    iconURL: interaction.guild.iconURL({ dynamic: true })
                })
                .setTimestamp();

            await interaction.channel.send({ embeds: [rulesEmbed] });

            await interaction.editReply({
                embeds: [embedBuilder.success('Success', 'Rules embed created!')]
            });
        } catch (error) {
            console.error('Rules command error:', error);
            await interaction.editReply({
                embeds: [embedBuilder.error('Error', 'Failed to create rules embed.')]
            });
        }
    }
};
