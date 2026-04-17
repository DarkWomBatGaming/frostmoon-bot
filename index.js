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

// ================= DATA FILE =================
const DATA_FILE = "./data.json";

let data = { verifyMessageId: null };

if (fs.existsSync(DATA_FILE)) {
  data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

// ================= IGN DATABASE =================
const igns = JSON.parse(fs.readFileSync("./igns.json", "utf8"))
  .map(n => n.toLowerCase());

// ================= SYSTEM MEMORY =================
const verifiedUsers = new Set();
const cooldown = new Map();

// ================= ROLE IDS =================
const WANDERERS = "1494032348067659949";
const KHANRIANS = "1493696754141626540";

// ================= CLIENT =================
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

// ================= SAVE =================
function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ================= READY EVENT =================
client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const channel = await client.channels.fetch("1494055445596209172");

  const embed = new EmbedBuilder()
    .setColor(0x7c4dff)
    .setTitle("🔐 Khanrians Verification System")
    .setDescription(
      "Click the button below to verify your IGN.\n\n" +
      "✔ Instant role upgrade\n✔ Secure system\n✔ Anti-fake protection"
    );

  const button = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("open_verify")
      .setLabel("Verify Now")
      .setEmoji("⚡")
      .setStyle(ButtonStyle.Success)
  );

  // ================= NO DUPLICATES LOGIC =================
  if (data.verifyMessageId) {
    try {
      const msg = await channel.messages.fetch(data.verifyMessageId);
      await msg.edit({ embeds: [embed], components: [button] });
      return;
    } catch (err) {
      console.log("Recreating verification panel...");
    }
  }

  const msg = await channel.send({
    embeds: [embed],
    components: [button]
  });

  data.verifyMessageId = msg.id;
  saveData();
});

// ================= INTERACTIONS =================
client.on(Events.InteractionCreate, async interaction => {

  // ================= BUTTON =================
  if (interaction.isButton() && interaction.customId === "open_verify") {

    const modal = new ModalBuilder()
      .setCustomId("verify_modal")
      .setTitle("IGN Verification");

    const input = new TextInputBuilder()
      .setCustomId("ign")
      .setLabel("Enter your IGN")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(input)
    );

    return interaction.showModal(modal);
  }

  // ================= MODAL =================
  if (interaction.isModalSubmit() && interaction.customId === "verify_modal") {

    const ign = interaction.fields.getTextInputValue("ign").toLowerCase();
    const userId = interaction.user.id;

    // anti spam cooldown
    if (cooldown.has(userId)) {
      return interaction.reply({ content: "⏳ Wait before retrying", ephemeral: true });
    }
    cooldown.set(userId, Date.now() + 10000);

    // animated flow
    await interaction.reply({ content: "🔍 Checking system...", ephemeral: true });
    setTimeout(() => interaction.editReply("🧠 Matching IGN..."), 1000);
    setTimeout(() => interaction.editReply("🔐 Verifying identity..."), 2500);

    setTimeout(async () => {

      if (verifiedUsers.has(userId)) {
        return interaction.editReply("⚠️ Already verified");
      }

      if (!igns.includes(ign)) {
        return interaction.editReply("❌ IGN not found");
      }

      try {
        const member = await interaction.guild.members.fetch(userId);

        await member.roles.remove(WANDERERS).catch(() => {});
        await member.roles.add(KHANRIANS).catch(() => {});

        verifiedUsers.add(userId);

        interaction.editReply("🎉 Verified!");
        interaction.followUp({
          content: "🏆 Welcome to Khanrians!",
          ephemeral: true
        });

      } catch (err) {
        console.error(err);
        interaction.editReply("⚠️ Role update failed");
      }

    }, 3500);
  }
});

// ================= LOGIN =================
client.login(process.env.TOKEN);
