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

const ALLOWED_IGNS = JSON.parse(fs.readFileSync("./data/igns.json"))
  .map(i => i.toLowerCase());

const LOCK_FILE = "./data/ui_lock.json";

/* SAFE FILE INIT */
if (!fs.existsSync("./data/used_igns.json")) {
  fs.writeFileSync("./data/used_igns.json", "[]");
}

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

  /* PANEL 1 */
  await channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor(0x0b1a2b)
        .setTitle("❄️ FROSTMOON CONTROL CORE")
        .setDescription(
          "```yaml\nSTATUS: ONLINE\nCORE: CRYO-STABLE\nSECURITY: ACTIVE\n```"
        )
    ]
  });

  /* PANEL 2 */
  const rosterMsg = await channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor(0x132f4c)
        .setTitle("📊 LIVE ROSTER")
        .setDescription("Initializing...")
    ]
  });

  /* PANEL 3 */
  const verifyMsg = await channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor(0x1f4e79)
        .setTitle("🧬 IDENTITY VERIFICATION CONSOLE")
        .setDescription(
          "```diff\n+ AWAITING TRAVELER AUTHORIZATION\n+ READY FOR INPUT\n```"
        )
    ],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("start")
          .setLabel("▶ INITIATE SCAN")
          .setStyle(ButtonStyle.Success)
      )
    ]
  });

  fs.writeFileSync(
    LOCK_FILE,
    JSON.stringify({
      rosterId: rosterMsg.id,
      verifyId: verifyMsg.id
    }, null, 2)
  );

  console.log("❄️ Frostmoon UI rebuilt cleanly.");
}

/* ================= HANDLER ================= */
async function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function handleInteraction(interaction) {

  /* ================= BUTTON ================= */
  if (interaction.isButton() && interaction.customId === "start") {

    await interaction.reply({ content: "> INITIALIZING CRYO SYSTEM...", ephemeral: true });

    await sleep(800);
    await interaction.editReply("> LOADING SECURITY LAYER...");

    await sleep(800);
    await interaction.editReply("> ESTABLISHING LINK...");

    await sleep(500);

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

  /* ================= MODAL ================= */
  if (interaction.isModalSubmit() && interaction.customId === "ign_modal") {

    const ign = interaction.fields.getTextInputValue("ign").toLowerCase();
    const member = await interaction.guild.members.fetch(interaction.user.id);

    await interaction.deferReply({ ephemeral: true });

    await interaction.editReply("> SCANNING DATABASE...");
    await sleep(900);

    await interaction.editReply("> MATCHING SIGNATURE...");
    await sleep(900);

    if (member.roles.cache.has(config.ROLE_KHANRIAN)) {
      return interaction.editReply("🧊 SYSTEM: Already verified.");
    }

    const used = JSON.parse(fs.readFileSync("./data/used_igns.json"));

    if (!ALLOWED_IGNS.includes(ign)) {
      return interaction.editReply(
        "❌ ACCESS DENIED\n> REASON: INVALID IDENTITY"
      );
    }

    if (used.find(u => u.ign === ign)) {
      return interaction.editReply(
        "🔒 ACCESS DENIED\n> REASON: ID ALREADY CLAIMED"
      );
    }

    /* ================= CONFIRM UI ================= */
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`confirm_${ign}`)
        .setLabel("CONFIRM AWAKENING")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("cancel")
        .setLabel("CANCEL")
        .setStyle(ButtonStyle.Danger)
    );

    return interaction.editReply({
      content: "",
      embeds: [
        new EmbedBuilder()
          .setColor(0x9fe7ff)
          .setTitle("IDENTITY DETECTED")
          .setDescription(`IGN: **${ign}**\nProceed with awakening?`)
      ],
      components: [row]
    });
  }

  /* ================= CANCEL ================= */
  if (interaction.isButton() && interaction.customId === "cancel") {
    return interaction.update({
      content: "> PROCESS TERMINATED",
      embeds: [],
      components: []
    });
  }

  /* ================= CONFIRM ================= */
  if (interaction.isButton() && interaction.customId.startsWith("confirm_")) {

    const ign = interaction.customId.replace("confirm_", "");
    const member = await interaction.guild.members.fetch(interaction.user.id);

    await interaction.update({ content: "> AUTHORIZING...", embeds: [], components: [] });

    await sleep(700);
    await interaction.editReply("> GRANTING ACCESS...");

    await sleep(700);
    await interaction.editReply("> LINKING TO FROSTMOON CORE...");

    await sleep(900);

    await member.roles.add(config.ROLE_KHANRIAN);
    await member.roles.remove(config.ROLE_WANDERER);

    const used = JSON.parse(fs.readFileSync("./data/used_igns.json"));
    used.push({ ign, userId: member.id });

    fs.writeFileSync("./data/used_igns.json", JSON.stringify(used, null, 2));

    await updateRoster(interaction.guild);

    return interaction.editReply(
      "✅ ACCESS GRANTED\n❄️ Welcome to Frostmoon."
    );
  }
}

module.exports = { setupVerification, handleInteraction };
