const { 
  Client, GatewayIntentBits, 
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ModalBuilder, TextInputBuilder, TextInputStyle,
  Events
} = require('discord.js');

const express = require('express');
const fs = require('fs');

// ===== EXPRESS (Render keep-alive) =====
const app = express();
app.get('/', (req, res) => res.send('Bot alive'));
const PORT = process.env.PORT || 3000;
app.listen(PORT);

// ===== BOT =====
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

// ===== ROLE IDS =====
const WANDERERS = "1494032348067659949";
const KHANRIANS = "1493696754141626540";

// ===== IGN DATABASE =====
const igns = JSON.parse(fs.readFileSync('./igns.json', 'utf8'))
  .map(n => n.toLowerCase());

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  // Send verify button to a channel (CHANGE CHANNEL ID)
  const channel = await client.channels.fetch("1494055445596209172");

  const button = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('open_verify')
      .setLabel('Verify IGN')
      .setStyle(ButtonStyle.Success)
  );

  channel.send({
    content: "Click below to verify your IGN:",
    components: [button]
  });
});

// ===== BUTTON CLICK =====
client.on(Events.InteractionCreate, async interaction => {

  // OPEN MODAL
  if (interaction.isButton() && interaction.customId === 'open_verify') {

    const modal = new ModalBuilder()
      .setCustomId('verify_modal')
      .setTitle('IGN Verification');

    const ignInput = new TextInputBuilder()
      .setCustomId('ign')
      .setLabel('Enter your In-Game Name')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(ignInput)
    );

    return interaction.showModal(modal);
  }

  // HANDLE MODAL SUBMIT
  if (interaction.isModalSubmit() && interaction.customId === 'verify_modal') {

    const ign = interaction.fields.getTextInputValue('ign').toLowerCase();

    if (!igns.includes(ign)) {
      return interaction.reply({
        content: "❌ IGN not found in team list.",
        ephemeral: true
      });
    }

    try {
      const member = interaction.member;

      await member.roles.remove(WANDERERS);
      await member.roles.add(KHANRIANS);

      return interaction.reply({
        content: "✅ Verified successfully! Roles updated.",
        ephemeral: true
      });

    } catch (err) {
      console.error(err);
      return interaction.reply({
        content: "⚠️ Error updating roles.",
        ephemeral: true
      });
    }
  }
});

client.login(process.env.TOKEN);
