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

  let lock = {};
  if (fs.existsSync(LOCK_FILE)) {
    lock = JSON.parse(fs.readFileSync(LOCK_FILE));
  }

  if (lock.messageId) {
    console.log("UI already exists");
    return;
  }

  const msg = await channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor(0x9fe7ff)
        .setTitle("❄️ FROSTMOON ACCESS TERMINAL")
        .setDescription(
          "```diff\n+ CRYO CORE ONLINE\n+ SECURITY ACTIVE\n+ READY FOR SCAN\n```"
        )
    ],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("start")
          .setLabel("▶ Initiate Scan")
          .setStyle(ButtonStyle.Success)
      )
    ]
  });

  fs.writeFileSync(LOCK_FILE, JSON.stringify({ messageId: msg.id }, null, 2));
}

/* ================= HANDLER ================= */
async function handleInteraction(interaction) {

  /* BUTTON */
  if (interaction.isButton() && interaction.customId === "start") {

    const modal = new ModalBuilder()
      .setCustomId("ign_modal")
      .setTitle("Frostmoon Identity Scan");

    const input = new TextInputBuilder()
      .setCustomId("ign")
      .setLabel("Enter IGN")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(input));

    return interaction.showModal(modal);
  }

  /* MODAL */
  if (interaction.isModalSubmit() && interaction.customId === "ign_modal") {

    const ign = interaction.fields.getTextInputValue("ign").toLowerCase();
    const member = await interaction.guild.members.fetch(interaction.user.id);

    await interaction.deferReply({ ephemeral: true });

    if (member.roles.cache.has(config.ROLE_KHANRIAN)) {
      return interaction.editReply("❄️ Already verified.");
    }

    const used = JSON.parse(fs.readFileSync("./data/used_igns.json"));

    if (!ALLOWED_IGNS.includes(ign)) {
      return interaction.editReply("🚫 Invalid IGN.");
    }

    if (used.find(u => u.ign === ign)) {
      return interaction.editReply("🔒 IGN already used.");
    }

    /* CONFIRM */
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`confirm_${ign}`)
        .setLabel("Confirm")
        .setStyle(ButtonStyle.Primary)
    );

    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x9fe7ff)
          .setTitle("Confirm Identity")
          .setDescription(`IGN: **${ign}**`)
      ],
      components: [row]
    });
  }

  /* CONFIRM */
  if (interaction.isButton() && interaction.customId.startsWith("confirm_")) {

    const ign = interaction.customId.replace("confirm_", "");
    const member = await interaction.guild.members.fetch(interaction.user.id);

    if (member.roles.cache.has(config.ROLE_KHANRIAN)) {
      return interaction.reply({ content: "Already verified", ephemeral: true });
    }

    await member.roles.add(config.ROLE_KHANRIAN);
    await member.roles.remove(config.ROLE_WANDERER);

    const used = JSON.parse(fs.readFileSync("./data/used_igns.json"));
    used.push({ ign, userId: member.id });

    fs.writeFileSync("./data/used_igns.json", JSON.stringify(used, null, 2));

    await updateRoster(interaction.guild);

    return interaction.update({
      content: "❄️ Verification successful.",
      embeds: [],
      components: []
    });
  }
}

module.exports = { setupVerification, handleInteraction };
