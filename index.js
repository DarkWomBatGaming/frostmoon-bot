const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  Events
} = require("discord.js");

const express = require("express");
const fs = require("fs");

// ================= EXPRESS (Render keep alive) =================
const app = express();
app.get("/", (req, res) => res.send("Bot Alive"));
const PORT = process.env.PORT || 3000;
app.listen(PORT);

// ================= IGN DATABASE =================
const igns = JSON.parse(fs.readFileSync("./igns.json", "utf8"))
  .map(n => n.toLowerCase());

// ================= SYSTEM MEMORY =================
const verifiedUsers = new Set();
const cooldown = new Map();

// ================= ROLE IDS =================
const WANDERERS = "1494032348067659949";
const KHANRIANS = "1493696754141626540";
const LOG_CHANNEL_ID = "1494753217362399384"; 
const COUNTER_CHANNEL_ID = "1494753332714278922";

// ================= CLIENT =================
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

// ================= READY EVENT =================
client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  // 1. Register Slash Commands (Wrapped correctly)
  const registerCommands = async () => {
    try {
      const guildId = "1493669690088882187"; // <--- MAKE SURE THIS IS YOUR ACTUAL SERVER ID
      const guild = client.guilds.cache.get(guildId);

      if (guild) {
        await guild.commands.set([
          {
            name: 'setcount',
            description: 'Manually set the total team member count',
            options: [
              {
                name: 'number',
                type: 4, // Integer
                description: 'The new total number of members',
                required: true,
              },
            ],
          },
        ]);
        console.log("Slash commands registered successfully!");
      }
    } catch (error) {
      console.error("Error registering commands:", error);
    }
  };

  await registerCommands();

  // 2. Handle Terminal Message
  try {
    const channel = await client.channels.fetch("1494055445596209172");
    const messages = await channel.messages.fetch({ limit: 10 });
    
    const existingMsg = messages.find(m => 
      m.author.id === client.user.id && 
      m.embeds[0]?.data?.title === "🧬 KHANRIANS ACCESS TERMINAL"
    );

    const embed = new EmbedBuilder()
      .setColor(0x00ffcc)
      .setTitle("🧬 KHANRIANS ACCESS TERMINAL")
      .setDescription("```SYSTEM BOOT SEQUENCE INITIATED...\nLOADING VERIFICATION MODULE...\nREADY FOR AUTH```");

    const button = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("open_verify")
        .setLabel("▶ VERIFY NOW")
        .setEmoji("🚀")
        .setStyle(ButtonStyle.Primary)
    );

    if (existingMsg) {
      await existingMsg.edit({ embeds: [embed], components: [button] });
      console.log("Updated existing terminal.");
    } else {
      await channel.send({ embeds: [embed], components: [button] });
      console.log("Sent new terminal.");
    }
  } catch (err) {
    console.error("Error setting up terminal channel:", err);
  }
});

// ================= INTERACTIONS =================
client.on(Events.InteractionCreate, async interaction => {

    // ================= SLASH COMMANDS =================
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'setcount') {
      
      // Security: Only allow people with Administrator permission
      if (!interaction.member.permissions.has("Administrator")) {
        return interaction.reply({ content: "❌ You don't have permission to use this.", ephemeral: true });
      }

      const newCount = interaction.options.getInteger('number');
      
      try {
        const counterChannel = await interaction.guild.channels.fetch(COUNTER_CHANNEL_ID);
        await counterChannel.setName(`📊 Team Size: ${newCount}`);
        
        await interaction.reply({ 
          content: `✅ System override successful. Team count set to **${newCount}**.`, 
          ephemeral: true 
        });
      } catch (err) {
        console.error(err);
        await interaction.reply({ content: "⚠️ Failed to update the channel name.", ephemeral: true });
      }
    }
  }

  // ================= BUTTON =================
  if (interaction.isButton() && interaction.customId === "open_verify") {
    const modal = new ModalBuilder()
      .setCustomId("verify_modal")
      .setTitle("IGN Verification");

    const input = new TextInputBuilder()
      .setCustomId("ign")
      .setLabel("Enter your IGN")
      .setPlaceholder("Type your in-game name here...")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(input));
    return interaction.showModal(modal);
  }

  // ================= MODAL =================
  if (interaction.isModalSubmit() && interaction.customId === "verify_modal") {
    const ign = interaction.fields.getTextInputValue("ign").toLowerCase();
    const userId = interaction.user.id;

    // Cooldown Check
    if (cooldown.has(userId) && Date.now() < cooldown.get(userId)) {
      return interaction.reply({
        content: "⏳ **SYSTEM COOLING DOWN...** Please wait a few seconds.",
        ephemeral: true
      });
    }
    cooldown.set(userId, Date.now() + 10000);

    // Use deferReply because the sequence takes > 3 seconds
    await interaction.deferReply({ ephemeral: true });
    await interaction.editReply("🧬 **INITIALIZING AUTH MODULE...**");

    // "Fake" loading sequence for aesthetic
    setTimeout(() => interaction.editReply("🔍 **SCANNING DATABASE...**"), 1200);
    setTimeout(() => interaction.editReply("🧠 **MATCHING BIOMETRIC IGN...**"), 2500);

    setTimeout(async () => {
      if (!igns.includes(ign)) {
        return interaction.editReply("❌ **ACCESS DENIED:** User not found in database.");
      }

      try {
        const member = await interaction.guild.members.fetch(userId);

        // Check if already verified
        if (member.roles.cache.has(KHANRIANS)) {
          return interaction.editReply("🛡️ **SYSTEM NOTE:** Biometrics already confirmed. You are already verified.");
        }

        // Role swap
        await member.roles.remove(WANDERERS).catch(() => console.log("Wanderer role not found on user."));
        await member.roles.add(KHANRIANS);

        await interaction.editReply("✅ **ACCESS GRANTED.** Welcome to the Khanrians.");
        
      } catch (err) {
        console.error(err);
        interaction.editReply("⚠️ **SYSTEM ERROR:** Could not update roles. Contact an admin.");
      }
    }, 3500);
  }
});

// ================= HELPER FUNCTION: UPDATE COUNT =================
async function updatePlayerCount(guild, change) {
  try {
    const counterChannel = await guild.channels.fetch(COUNTER_CHANNEL_ID);
    if (!counterChannel) return;

    // Get current number from the channel name (e.g., "Players: 42")
    const currentName = counterChannel.name;
    const currentCount = parseInt(currentName.replace(/\D/g, "")) || 0;
    
    const newCount = Math.max(0, currentCount + change); // Ensure it never goes below 0
    await counterChannel.setName(`📊 Team Size: ${newCount}`);
  } catch (err) {
    console.error("Error updating counter channel:", err);
  }
}

// ================= LOGGING: WHEN USER VERIFIES (ADD TO YOUR MODAL CODE) =================
// Inside your modal success block, right after member.roles.add(KHANRIANS):

const logChannel = await interaction.guild.channels.fetch(LOG_CHANNEL_ID);
const logEmbed = new EmbedBuilder()
  .setColor(0x00ff00)
  .setTitle("📥 NEW TEAM MEMBER")
  .setDescription(`**User:** <@${userId}>\n**IGN:** \`${ign}\`\n**Status:** Verified & Added to Team`)
  .setTimestamp();

await logChannel.send({ embeds: [logEmbed] });
await updatePlayerCount(interaction.guild, 1); // Increase count by 1


// ================= LOGGING: WHEN USER LEAVES =================
client.on(Events.GuildMemberRemove, async member => {
  // Check if they were part of the team (Khanrians) before they left
  if (member.roles.cache.has(KHANRIANS)) {
    const logChannel = await member.guild.channels.fetch(LOG_CHANNEL_ID);
    
    const leaveEmbed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle("📤 MEMBER DEPARTED")
      .setDescription(`**User:** ${member.user.tag}\n**Status:** Left the server / Removed from Team`)
      .setTimestamp();

    await logChannel.send({ embeds: [leaveEmbed] });
    await updatePlayerCount(member.guild, -1); // Decrease count by 1
  }
});


client.login(process.env.TOKEN);
