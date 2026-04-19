const fs = require("fs");
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require("discord.js");

const config = require("../config");
const { updateRoster } = require("./rosterService");

const LOCK_FILE = "./data/ui_lock.json";

const ICON_URL =
  "https://cdn.discordapp.com/attachments/1479200956209041613/1495041778544541799/frostmoon_icon.jpg?ex=69e4cda8&is=69e37c28&hm=1b262b2ca95eae227d638b7a9757a2fcd9e1488e35deb9aace2b929b21d695d5";

const BANNER_URL =
  "https://cdn.discordapp.com/attachments/1479200956209041613/1495036786970198147/Frost_Moon_Reborn.webp?ex=69e4c902&is=69e37782&hm=fa3e03d66a30350283d3a8c5587883262a789b43d84d37436c8d483f6efe5fa9";

// Ensure used_igns exists
if (!fs.existsSync("./data/used_igns.json")) {
  fs.writeFileSync("./data/used_igns.json", "[]");
}

// Store pending IGN per user (so we don't put IGN into customId)
const pendingIgnByUserId = new Map(); // userId -> ign

/* ================= UI SETUP ================= */
async function setupVerification(client) {
  const channel = await client.channels.fetch(config.CHANNEL_ID);

  console.log("🧹 Cleaning old Frostmoon UI...");

  const messages = await channel.messages.fetch({ limit: 100 });
  const botMessages = messages.filter(m => m.author.id === client.user.id);

  for (const msg of botMessages.values()) {
    await msg.delete().catch(() => {});
  }

  console.log("✅ Old UI cleared.");

  // PANEL 1
  await channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor(0x0b1a2b)
        .setTitle("❄️ Frostmoon Control Core")
        .setDescription("System online and secured.")
        .addFields(
          { name: "Status", value: "🟢 Online", inline: true },
          { name: "Core", value: "Cryo-stable", inline: true },
          { name: "Security", value: "Active", inline: true }
        )
        .setThumbnail(ICON_URL)
        .setImage(BANNER_URL)
        .setFooter({ text: "Frostmoon Security �� Automated Systems" })
    ]
  });

  // PANEL 2 (roster placeholder)
  const rosterMsg = await channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor(0x132f4c)
        .setTitle("📊 Live Roster")
        .setDescription("Loading roster data…")
        .setThumbnail(ICON_URL)
        .setFooter({ text: "Auto-updated • Cache-based count" })
    ]
  });

  // PANEL 3 (verification)
  const verifyMsg = await channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor(0x1f4e79)
        .setTitle("🧬 Identity Verification")
        .setDescription("Press **Initiate Scan** to begin verification.")
        .addFields(
          { name: "Status", value: "🟢 Ready", inline: true },
          { name: "Input", value: "IGN", inline: true },
          { name: "Note", value: "IGN must match the approved roster list.", inline: false }
        )
        .setThumbnail(ICON_URL)
        .setImage(BANNER_URL)
        .setFooter({ text: "Frostmoon Security • Verification Console" })
    ],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("start")
          .setLabel("Initiate Scan")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("help")
          .setLabel("Help")
          .setStyle(ButtonStyle.Secondary)
      )
    ]
  });

  fs.writeFileSync(
    LOCK_FILE,
    JSON.stringify({ rosterId: rosterMsg.id, verifyId: verifyMsg.id }, null, 2)
  );

  console.log("❄️ Frostmoon UI rebuilt cleanly.");

  // Try updating roster once on startup
  const guild = client.guilds.cache.get(config.GUILD_ID) ?? client.guilds.cache.first();
  if (guild) await updateRoster(guild);
}

/* ================= HELPERS ================= */
function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function readAllowedIgnsLower() {
  try {
    const data = JSON.parse(fs.readFileSync("./data/igns.json", "utf8"));
    if (!Array.isArray(data)) return [];
    return data.map(i => String(i).toLowerCase());
  } catch {
    return [];
  }
}

function readUsed() {
  try {
    const data = JSON.parse(fs.readFileSync("./data/used_igns.json", "utf8"));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeUsed(list) {
  fs.writeFileSync("./data/used_igns.json", JSON.stringify(list, null, 2));
}

/* ================= HANDLER ================= */
async function handleInteraction(interaction) {
  // BUTTON: help
  if (interaction.isButton() && interaction.customId === "help") {
    return interaction.reply({
      ephemeral: true,
      content:
        "**How verification works**\n" +
        "1) Click **Initiate Scan**\n" +
        "2) Enter your IGN exactly as listed\n" +
        "3) Confirm to receive access\n\n" +
        "If your IGN is missing or already claimed, contact staff."
    });
  }

  // BUTTON: start
  if (interaction.isButton() && interaction.customId === "start") {
    const modal = new ModalBuilder()
      .setCustomId("ign_modal")
      .setTitle("Frostmoon Identity Matrix");

    const input = new TextInputBuilder()
      .setCustomId("ign")
      .setLabel("Enter your IGN")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(input));
    return interaction.showModal(modal);
  }

  // MODAL: submit IGN
  if (interaction.isModalSubmit() && interaction.customId === "ign_modal") {
    const ign = String(interaction.fields.getTextInputValue("ign") || "")
      .trim()
      .toLowerCase();

    const member = await interaction.guild.members.fetch(interaction.user.id);

    await interaction.deferReply({ ephemeral: true });

    await interaction.editReply("> SCANNING DATABASE...");
    await sleep(900);

    await interaction.editReply("> MATCHING SIGNATURE...");
    await sleep(900);

    if (member.roles.cache.has(config.ROLE_KHANRIAN)) {
      return interaction.editReply("🧊 SYSTEM: Already verified.");
    }

    const allowed = readAllowedIgnsLower(); // reload each time so newly added names work
    const used = readUsed();

    if (!allowed.includes(ign)) {
      return interaction.editReply("❌ ACCESS DENIED\n> REASON: INVALID IDENTITY");
    }

    if (used.find(u => String(u?.ign || "").toLowerCase() === ign)) {
      return interaction.editReply("🔒 ACCESS DENIED\n> REASON: ID ALREADY CLAIMED");
    }

    // store pending ign for this user, then show confirm buttons
    pendingIgnByUserId.set(interaction.user.id, ign);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("confirm_verify")
        .setLabel("Confirm Awakening")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("cancel_verify")
        .setLabel("Cancel")
        .setStyle(ButtonStyle.Danger)
    );

    return interaction.editReply({
      content: "",
      embeds: [
        new EmbedBuilder()
          .setColor(0x9fe7ff)
          .setTitle("Identity Detected")
          .setDescription(`IGN: **${ign}**\nProceed with awakening?`)
          .setThumbnail(ICON_URL)
          .setFooter({ text: "Frostmoon Security" })
      ],
      components: [row]
    });
  }

  // BUTTON: cancel verify
  if (interaction.isButton() && interaction.customId === "cancel_verify") {
    pendingIgnByUserId.delete(interaction.user.id);
    return interaction.update({ content: "> PROCESS TERMINATED", embeds: [], components: [] });
  }

  // BUTTON: confirm verify
  if (interaction.isButton() && interaction.customId === "confirm_verify") {
    const member = await interaction.guild.members.fetch(interaction.user.id);

    const ign = pendingIgnByUserId.get(interaction.user.id);
    if (!ign) {
      return interaction.reply({
        ephemeral: true,
        content: "❌ Verification expired. Please click **Initiate Scan** again."
      });
    }

    await interaction.update({ content: "> AUTHORIZING...", embeds: [], components: [] });

    await sleep(700);
    await interaction.editReply("> GRANTING ACCESS...");

    await sleep(700);
    await interaction.editReply("> LINKING TO FROSTMOON CORE...");

    await sleep(900);

    // Final safety: re-check used list right before claiming
    const used = readUsed();
    if (used.find(u => String(u?.ign || "").toLowerCase() === ign)) {
      pendingIgnByUserId.delete(interaction.user.id);
      return interaction.editReply("🔒 ACCESS DENIED\n> REASON: ID ALREADY CLAIMED");
    }

    // Roles MUST succeed, otherwise do not claim IGN
    try {
      await member.roles.add(config.ROLE_KHANRIAN);
      await member.roles.remove(config.ROLE_WANDERER);
    } catch (e) {
      console.error("❌ Verification role update failed:", e);
      return interaction.editReply(
        "❌ VERIFICATION FAILED\n" +
          "> REASON: BOT COULD NOT UPDATE ROLES\n" +
          `> DETAILS: ${e?.message || e}`
      );
    }

    used.push({ ign, userId: member.id });
    writeUsed(used);

    pendingIgnByUserId.delete(interaction.user.id);

    await updateRoster(interaction.guild);
    return interaction.editReply("✅ ACCESS GRANTED\n❄️ Welcome to Frostmoon.");
  }
}

module.exports = { setupVerification, handleInteraction };
