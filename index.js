const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  Events,
  EmbedBuilder
} = require('discord.js');

const express = require('express');
const fs = require('fs');
const verifiedUsers = new Set();
const cooldown = new Map();
const app = express();
app.get('/', (req, res) => res.send('Bot alive'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running"));
const igns = JSON.parse(fs.readFileSync('./igns.json', 'utf8'))
  .map(n => n.toLowerCase());
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});
const WANDERERS = "1494032348067659949";
const KHANRIANS = "1493696754141626540";
client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const channel = await client.channels.fetch("1494055445596209172");

  const embed = new EmbedBuilder()
    .setColor(0x7c4dff)
    .setTitle("🔐 Verification System")
    .setDescription("Click below to verify your IGN");

  const button = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('open_verify')
      .setLabel('Verify Now')
      .setEmoji('⚡')
      .setStyle(ButtonStyle.Success)
  );

  channel.send({ embeds: [embed], components: [button] });
});
client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isButton() && interaction.customId === 'open_verify') {

    const modal = new ModalBuilder()
      .setCustomId('verify_modal')
      .setTitle('IGN Verification');

    const ignInput = new TextInputBuilder()
      .setCustomId('ign')
      .setLabel('Enter IGN')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(ignInput)
    );

    return interaction.showModal(modal);
  }
    if (interaction.isModalSubmit() && interaction.customId === 'verify_modal') {

    const ign = interaction.fields.getTextInputValue('ign').toLowerCase();
    const userId = interaction.user.id;

    // cooldown
    if (cooldown.has(userId)) {
      return interaction.reply({ content: "⏳ Wait before retrying", ephemeral: true });
    }
    cooldown.set(userId, Date.now() + 10000);

    await interaction.reply({ content: "🔍 Checking...", ephemeral: true });

    setTimeout(() => interaction.editReply("🧠 Matching IGN..."), 1000);
    setTimeout(() => interaction.editReply("🔐 Verifying..."), 2500);

    setTimeout(async () => {

      if (verifiedUsers.has(userId)) {
        return interaction.editReply("⚠️ Already verified");
      }

      if (!igns.includes(ign)) {
        return interaction.editReply("❌ IGN not found");
      }

      const member = await interaction.guild.members.fetch(userId);

      await member.roles.remove(WANDERERS).catch(() => {});
      await member.roles.add(KHANRIANS).catch(() => {});

      verifiedUsers.add(userId);

      interaction.editReply("🎉 Verified!");
      interaction.followUp({ content: "🏆 You are now Khanrian!", ephemeral: true });

    }, 3500);
  }
});
client.login(process.env.TOKEN);
