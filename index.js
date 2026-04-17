const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const express = require('express');
const fs = require('fs');

// ===== EXPRESS (for Render) =====
const app = express();
app.get('/', (req, res) => res.send('Bot alive'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));

// ===== LOAD IGNS =====
const igns = JSON.parse(fs.readFileSync('./igns.json', 'utf8')).map(n => n.toLowerCase());

// ===== DISCORD CLIENT =====
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ===== ROLE IDS =====
const WANDERERS_ROLE = '1494032348067659949';
const KHANRIANS_ROLE = '1493696754141626540';

// ===== SLASH COMMAND SETUP =====
const commands = [
  new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Verify your IGN')
    .addStringOption(option =>
      option.setName('username')
        .setDescription('Your in-game name')
        .setRequired(true)
    )
].map(cmd => cmd.toJSON());

// ===== REGISTER COMMAND =====
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    await rest.put(
  Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
  { body: commands }
);
    console.log('Slash command registered');
  } catch (error) {
    console.error(error);
  }
})();

// ===== BOT READY =====
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// ===== COMMAND HANDLER =====
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'verify') {
    const username = interaction.options.getString('username').toLowerCase();

    if (!igns.includes(username)) {
      return interaction.reply({
        content: '❌ You are not in the team list.',
        ephemeral: true
      });
    }

    try {
      const member = interaction.member;

      await member.roles.remove(WANDERERS_ROLE);
      await member.roles.add(KHANRIANS_ROLE);

      await interaction.reply({
        content: '✅ You are verified! Role updated.',
        ephemeral: true
      });

    } catch (err) {
      console.error(err);
      await interaction.reply({
        content: '⚠️ Error updating roles.',
        ephemeral: true
      });
    }
  }
});

// ===== LOGIN =====
client.login(process.env.TOKEN);
