const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'verify') {
    const ign = interaction.options.getString('ign');

    if (!ign || ign.length < 3) {
      return interaction.reply({ content: 'Invalid IGN ❌', ephemeral: true });
    }

    const member = interaction.member;

    const verifiedRole = interaction.guild.roles.cache.get('1493696754141626540');
    const wandererRole = interaction.guild.roles.cache.get('1494032348067659949');

    try {
      await member.roles.add(verifiedRole);
      await member.roles.remove(wandererRole);

      await interaction.reply(`❄️ Verified as ${ign} | Welcome to Frostmoon 🌙`);
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: 'Error ❌', ephemeral: true });
    }
  }
});

client.login(process.env.TOKEN);
