const express = require("express");
const app = express();

app.get("/", (req, res) => res.send("Frostmoon Bot Running"));
app.listen(process.env.PORT || 3000);

/* ================= DISCORD ================= */
const {
  Client,
  GatewayIntentBits,
  Events,
  EmbedBuilder
} = require("discord.js");

const fs = require("fs");

/* ================= DATA ================= */
const ALLOWED_IGNS = JSON.parse(fs.readFileSync("./igns.json", "utf8"))
  .map(i => i.toLowerCase());

let USED_IGNS = fs.existsSync("./used_igns.json")
  ? JSON.parse(fs.readFileSync("./used_igns.json", "utf8"))
  : [];

/* ================= IDS ================= */
const GUILD_ID = "1493669690088882187";
const REALM_CHANNEL_ID = "1494055445596209172";
const LOG_CHANNEL_ID = "1494753217362399384";

const ROLE_WANDERER = "1494032348067659949";
const ROLE_KHANRIAN = "1493696754141626540";

/* ================= CLIENT ================= */
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

/* ================= COMMAND LOADER ================= */
const commands = new Map();
const commandFiles = fs.readdirSync("./commands").filter(f => f.endsWith(".js"));

for (const file of commandFiles) {
  const cmd = require(`./commands/${file}`);
  commands.set(cmd.name, cmd);
}

/* ================= READY ================= */
client.once("clientReady", async () => {
  console.log(`❄️ Logged in as ${client.user.tag}`);

  try {
    const guild = client.guilds.cache.get(GUILD_ID);
    const channel = await client.channels.fetch(REALM_CHANNEL_ID);

    if (!channel) {
      console.log("❌ Channel not found. Check ID.");
      return;
    }

    console.log("✅ Channel found:", channel.name);

    // Register slash commands
    await guild.commands.set(
      commandFiles.map(file => {
        const cmd = require(`./commands/${file}`);
        return {
          name: cmd.name,
          description: cmd.description,
          options: cmd.options || []
        };
      })
    );

    // Fetch messages
    const messages = await channel.messages.fetch({ limit: 10 });

    let rosterMsg = messages.find(
      m => m.embeds[0]?.title === "📊 FROSTMOON ROSTER"
    );

    if (!rosterMsg) {
      console.log("📊 Creating roster message...");
      await channel.send({ embeds: [createCountEmbed(0)] });
    } else {
      console.log("📊 Roster already exists");
    }

    await recountTeam(guild);

  } catch (err) {
    console.error("❌ READY ERROR:", err);
  }
});

/* ================= COMMAND EXECUTION ================= */
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const cmd = commands.get(interaction.commandName);
  if (!cmd) return;

  await cmd.execute(interaction, {
    USED_IGNS,
    ALLOWED_IGNS,
    ROLE_KHANRIAN,
    ROLE_WANDERER,
    REALM_CHANNEL_ID,
    LOG_CHANNEL_ID,
    fs,
    recountTeam,
    createCountEmbed
  });
});

/* ================= MESSAGE VERIFY ================= */
client.on(Events.MessageCreate, async message => {
  if (message.channel.id !== REALM_CHANNEL_ID) return;
  if (message.author.bot) return;

  const ign = message.content.toLowerCase();
  await message.delete().catch(() => {});

  const member = await message.guild.members.fetch(message.author.id);

  if (member.roles.cache.has(ROLE_KHANRIAN)) {
    return message.author.send("❄️ You are already verified.").catch(() => {});
  }

  if (!ALLOWED_IGNS.includes(ign)) {
    return message.author.send("🚫 Invalid IGN.").catch(() => {});
  }

  if (USED_IGNS.some(e => e.ign === ign)) {
    return message.author.send("🔒 IGN already used.").catch(() => {});
  }

  await member.roles.remove(ROLE_WANDERER).catch(() => {});
  await member.roles.add(ROLE_KHANRIAN);

  USED_IGNS.push({ ign, userId: member.id });
  fs.writeFileSync("./used_igns.json", JSON.stringify(USED_IGNS, null, 2));

  await message.author.send("❄️ Verification successful.").catch(() => {});

  await recountTeam(message.guild);
});

/* ================= HELPERS ================= */
function createCountEmbed(count) {
  return new EmbedBuilder()
    .setColor(0x9fe7ff)
    .setTitle("📊 FROSTMOON ROSTER")
    .setDescription(`# ❄️ ${count}`);
}

async function recountTeam(guild) {
  try {
    const channel = await guild.channels.fetch(REALM_CHANNEL_ID);
    const messages = await channel.messages.fetch({ limit: 10 });

    const count = guild.members.cache.filter(m =>
      m.roles.cache.has(ROLE_KHANRIAN)
    ).size;

    const msg = messages.find(m => m.embeds[0]?.title === "📊 FROSTMOON ROSTER");

    if (msg) {
      await msg.edit({ embeds: [createCountEmbed(count)] });
    } else {
      console.log("⚠️ No roster message found to update.");
    }
  } catch (err) {
    console.error("❌ Count update error:", err);
  }
}

/* ================= BUTTON ================= */

await channel.send({
  embeds: [
    new EmbedBuilder()
      .setColor(0x9fe7ff)
      .setTitle("❄️ FROSTMOON ACCESS TERMINAL")
      .setDescription(
        "```\nInitializing Cryo Gate...\nScanning traveler identity...\nAwaiting input...\n```"
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

/* ================= MODAL ================= */

if (interaction.isButton() && interaction.customId === "fm_start") {

  const modal = new ModalBuilder()
    .setCustomId("fm_ign")
    .setTitle("Frostmoon Identity Scan");

  const ign = new TextInputBuilder()
    .setCustomId("ign")
    .setLabel("Enter your Traveler Name (IGN)")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder().addComponents(ign));

  return interaction.showModal(modal);
}

/* ================= ANIMATED STYLE CHECK ================= */

if (interaction.isModalSubmit() && interaction.customId === "fm_ign") {

  const ign = interaction.fields.getTextInputValue("ign").toLowerCase();
  const member = await interaction.guild.members.fetch(interaction.user.id);

  await interaction.deferReply({ ephemeral: true });

  await interaction.editReply("❄️ Scanning Cryo resonance...");

  await new Promise(r => setTimeout(r, 1200));

  await interaction.editReply("🧠 Matching Frostmoon archives...");

  await new Promise(r => setTimeout(r, 1200));

  /* ================= VALIDATION ================= */

    if (member.roles.cache.has(ROLE_KHANRIAN)) {
    return interaction.editReply("❄️ Already a Frostmoon member.");
  }

  if (!ALLOWED_IGNS.includes(ign)) {
    return interaction.editReply("🚫 Identity not found in Cryo registry.");
  }

  if (USED_IGNS.some(e => e.ign === ign)) {
    return interaction.editReply("🔒 This identity has already been claimed.");
  }

  /* ================= CONFIRMATION UI ================= */

    const confirmRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`fm_confirm_${ign}`)
      .setLabel("Confirm Awakening")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId("fm_cancel")
      .setLabel("Abort Ritual")
      .setStyle(ButtonStyle.Danger)
  );

  return interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor(0x9fe7ff)
        .setTitle("❄️ Frostmoon Awakening Seal")
        .setDescription(
          `Traveler Identity: **${ign}**\n\n` +
          "Do you accept the Frostmoon covenant?"
        )
    ],
    components: [confirmRow]
  });
}

/* ================= CONFIRM BUTTON (ROLE APPLY) ================= */

if (interaction.isButton() && interaction.customId.startsWith("fm_confirm_")) {

  const ign = interaction.customId.replace("fm_confirm_", "");
  const member = await interaction.guild.members.fetch(interaction.user.id);

  await member.roles.add(ROLE_KHANRIAN);
  await member.roles.remove(ROLE_WANDERER);

  USED_IGNS.push({ ign, userId: member.id });
  fs.writeFileSync("./used_igns.json", JSON.stringify(USED_IGNS, null, 2));

  await recountTeam(interaction.guild);

  return interaction.update({
    embeds: [
      new EmbedBuilder()
        .setColor(0x00ffcc)
        .setTitle("❄️ Awakening Complete")
        .setDescription("Welcome to Frostmoon, traveler.")
    ],
    components: []
  });
}

/* ================= CANCEL BUTTON ================= */

if (interaction.isButton() && interaction.customId === "fm_cancel") {
  return interaction.update({
    content: "❌ Ritual aborted.",
    embeds: [],
    components: []
  });
}
client.login(process.env.TOKEN);
