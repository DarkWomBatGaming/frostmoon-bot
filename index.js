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

  try {
    if (data.verifyMessageId) {
      const msg = await channel.messages.fetch(data.verifyMessageId);

      await msg.edit({
        embeds: [embed],
        components: [button]
      });

      console.log("Updated existing verification panel");
      return;
    }
  } catch (err) {
    console.log("Old message not found, creating new one");
  }

  const newMsg = await channel.send({
    embeds: [embed],
    components: [button]
  });

  data.verifyMessageId = newMsg.id;
  saveData();
});
  data.verifyMessageId = newMsg.id;
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

   if (cooldown.has(userId)) {
  const expireTime = cooldown.get(userId);

  if (Date.now() < expireTime) {
    return interaction.reply({
      content: "⏳ SYSTEM COOLING DOWN... TRY AGAIN SHORTLY",
      ephemeral: true
    });
  }

  // expired → remove it
  cooldown.delete(userId);
}

   cooldown.set(userId, Date.now() + 10000); // 10 seconds

    await interaction.reply({
      content: "🧬 INITIALIZING AUTH MODULE...",
      ephemeral: true
    });

    setTimeout(() => interaction.editReply("🔍 SCANNING DATABASE..."), 1200);
    setTimeout(() => interaction.editReply("🧠 MATCHING BIOMETRIC IGN..."), 2500);

    setTimeout(async () => {

      if (!igns.includes(ign)) {
        return interaction.editReply("❌ ACCESS DENIED: USER NOT FOUND");
      }

      try {
        const member = await interaction.guild.members.fetch(userId);

        await member.roles.remove(WANDERERS).catch(() => {});
        await member.roles.add(KHANRIANS).catch(() => {});

        interaction.editReply("✅ ACCESS GRANTED");

        setTimeout(() => {
          interaction.followUp({
            content: "🎉 WELCOME TO KHANRIANS — YOU ARE NOW VERIFIED",
            ephemeral: true
          });
        }, 1200);

      } catch (err) {
        console.log(err);
        interaction.editReply("⚠️ SYSTEM ERROR");
      }

    }, 3500);
  }
});

// ================= LOGIN =================
client.login(process.env.TOKEN);
