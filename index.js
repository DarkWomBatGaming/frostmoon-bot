const express = require("express");
const app = express();

app.get("/", (req, res) => res.send("Frostmoon Bot Running"));
app.listen(process.env.PORT || 3000);

const {
  Client,
  GatewayIntentBits,
  Events,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require("discord.js");

const fs = require("fs");

/* ================= DATA ================= */
const ALLOWED_IGNS = JSON.parse(fs.readFileSync("./igns.json", "utf8")).map(i => i.toLowerCase());

let USED_IGNS = fs.existsSync("./used_igns.json")
  ? JSON.parse(fs.readFileSync("./used_igns.json", "utf8"))
  : [];

/* ================= IDS ================= */
const GUILD_ID = "1493669690088882187";
const REALM_CHANNEL_ID = "1494055445596209172";

const ROLE_WANDERER = "1494032348067659949";
const ROLE_KHANRIAN = "1493696754141626540";

/* ================= CLIENT ================= */
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

/* ================= READY ================= */
client.once("clientReady", async () => {
  console.log(`❄️ Logged in as ${client.user.tag}`);

  const guild = client.guilds.cache.get(GUILD_ID);
  const channel = await client.channels.fetch(REALM_CHANNEL_ID);

  /* 🔥 CLEAN OLD BOT MESSAGES (roster only) */
  const messages = await channel.messages.fetch({ limit: 20 });
  for (const msg of messages.values()) {
    if (msg.author.id === client.user.id) {
      await msg.delete().catch(() => {});
    }
  }

  /* 📊 ROSTER */
  await channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor(0x9fe7ff)
        .setTitle("📊 FROSTMOON ROSTER")
        .setDescription("Initializing...")
    ]
  });

  /* ❄️ VERIFICATION UI */
  await channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor(0x9fe7ff)
        .setTitle("❄️ FROSTMOON ACCESS TERMINAL")
        .setDescription(
          "Aether Gate is now open.\nClick below to begin verification."
        )
    ],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("fm_start")
          .setLabel("Enter Frostmoon Gate")
          .setStyle(ButtonStyle.Primary)
      )
    ]
  });

  await updateRoster(guild);
});

/* ================= INTERACTIONS ================= */
client.on(Events.InteractionCreate, async interaction => {

  /* ===== START BUTTON ===== */
  if (interaction.isButton() && interaction.customId === "fm_start") {

    const modal = new ModalBuilder()
      .setCustomId("fm_ign")
      .setTitle("Frostmoon Identity Scan");

    const ign = new TextInputBuilder()
      .setCustomId("ign")
      .setLabel("Enter your IGN")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(ign));

    return interaction.showModal(modal);
  }

  /* ===== MODAL ===== */
  if (interaction.isModalSubmit() && interaction.customId === "fm_ign") {

    const ign = interaction.fields.getTextInputValue("ign").toLowerCase();
    const member = await interaction.guild.members.fetch(interaction.user.id);

    await interaction.deferReply({ ephemeral: true });

    await interaction.editReply("🧠 Scanning Cryo signature...");

    if (member.roles.cache.has(ROLE_KHANRIAN)) {
      return interaction.editReply("❄️ Already verified.");
    }

    if (!ALLOWED_IGNS.includes(ign)) {
      return interaction.editReply("🚫 Invalid Cryo identity.");
    }

    if (USED_IGNS.some(e => e.ign === ign)) {
      return interaction.editReply("🔒 IGN already used.");
    }

    /* ===== CONFIRM UI ===== */
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`fm_confirm_${ign}`)
        .setLabel("Confirm Awakening")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("fm_cancel")
        .setLabel("Cancel")
        .setStyle(ButtonStyle.Danger)
    );

    return interaction.editReply({
      content: "",
      embeds: [
        new EmbedBuilder()
          .setColor(0x9fe7ff)
          .setTitle("❄️ Confirm Identity")
          .setDescription(`IGN detected: **${ign}**`)
      ],
      components: [row]
    });
  }

  /* ===== CONFIRM ===== */
  if (interaction.isButton() && interaction.customId.startsWith("fm_confirm_")) {

    const ign = interaction.customId.replace("fm_confirm_", "");
    const member = await interaction.guild.members.fetch(interaction.user.id);

    await member.roles.add(ROLE_KHANRIAN);
    await member.roles.remove(ROLE_WANDERER);

    USED_IGNS.push({ ign, userId: member.id });
    fs.writeFileSync("./used_igns.json", JSON.stringify(USED_IGNS, null, 2));

    await updateRoster(interaction.guild);

    return interaction.update({
      embeds: [
        new EmbedBuilder()
          .setColor(0x00ffcc)
          .setTitle("❄️ Access Granted")
          .setDescription("Welcome to Frostmoon.")
      ],
      components: []
    });
  }

  /* ===== CANCEL ===== */
  if (interaction.isButton() && interaction.customId === "fm_cancel") {
    return interaction.update({
      content: "❌ Cancelled.",
      embeds: [],
      components: []
    });
  }
});

/* ================= ROSTER ================= */
async function updateRoster(guild) {
  const channel = await guild.channels.fetch(REALM_CHANNEL_ID);

  const count = guild.members.cache.filter(m =>
    m.roles.cache.has(ROLE_KHANRIAN)
  ).size;

  const messages = await channel.messages.fetch({ limit: 10 });
  const msg = messages.find(m => m.embeds[0]?.title === "📊 FROSTMOON ROSTER");

  if (msg) {
    await msg.edit({
      embeds: [
        new EmbedBuilder()
          .setColor(0x9fe7ff)
          .setTitle("📊 FROSTMOON ROSTER")
          .setDescription(`❄️ Members: **${count}**`)
      ]
    });
  }
}

client.login(process.env.TOKEN);
