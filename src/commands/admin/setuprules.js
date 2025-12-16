const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const embedBuilder = require('../../utils/embedBuilder');

const RULES_BANNER = 'https://cdn.discordapp.com/attachments/531892263652032522/1448020593336254594/Gemini_Generated_Image_i8jr95i8jr95i8jr.png';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setuprules')
        .setDescription('Create server rules embed')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const rulesEmbed = new EmbedBuilder()
                .setColor('#2B2D31')
                .setAuthor({
                    name: interaction.guild.name.toUpperCase(),
                    iconURL: interaction.guild.iconURL({ dynamic: true })
                })
                .setTitle('📜 Server Rules')
                .setDescription(
                    `> By being in this server, you agree to follow all rules below.\n\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
                )
                .addFields(
                    {
                        name: '1️⃣ Be Respectful',
                        value: '> Be respectful to other people, treat others like how you want them to treat you.',
                        inline: false
                    },
                    {
                        name: '2️⃣ Use Correct Channels',
                        value: '> Use the correct channels when possible. If you are unsure, ping a mod.\n> Bot commands strictly in bot-commands channel.',
                        inline: false
                    },
                    {
                        name: '3️⃣ No Malicious Links',
                        value: '> Do not send malicious links, doing so will result in a punishment.\n> Crashing GIFs fall under here.',
                        inline: false
                    },
                    {
                        name: '4️⃣ Chat Etiquette',
                        value: '> Practice chat etiquette, refrain from spamming/flooding channels.\n> This also includes spam pinging.',
                        inline: false
                    },
                    {
                        name: '5️⃣ Voice Chat Rules',
                        value: '> While in a voice channel, do not spam loud noises/soundboard.\n> Soundboard is fun from time to time but repetitive spamming could be annoying.',
                        inline: false
                    },
                    {
                        name: '6️⃣ Language Rules',
                        value: '> Cursing is allowed, but extreme ones (including the hard r) are not allowed.\n> Even if it isn\'t directed at someone, you will still be punished.',
                        inline: false
                    },
                    {
                        name: '7️⃣ No Arguments',
                        value: '> Don\'t bring arguments into the server. Do it in DMs.\n> Just don\'t start arguments in general.',
                        inline: false
                    },
                    {
                        name: '8️⃣ Stay SFW',
                        value: '> Not everyone in the server is above the age of 18.',
                        inline: false
                    },
                    {
                        name: '9️⃣ Staff Discretion',
                        value: '> The staff reserves the right to punish a member even if no rules have been directly violated as long as the member in question has been disrespectful to the staff.',
                        inline: false
                    },
                    {
                        name: '⚠️ IMPORTANT',
                        value: '```diff\n- LEAKING OF PAID ASSETS IS STRICTLY PROHIBITED\n- IF YOU ARE FOUND DOING SO IT WILL LEAD TO AN INSTANT BAN\n```',
                        inline: false
                    },
                    {
                        name: '📜 Terms of Service',
                        value: '> 🔗 [Discord TOS](https://discord.com/terms) also applies here.',
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
