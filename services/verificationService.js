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

/* IDS */
const GUILD_ID = "1493669690088882187";
const CHANNEL_ID = "1494055445596209172";

const ROLE_WANDERER = "1494032348067659949";
const ROLE_KHANRIAN = "1493696754141626540";

/* DATA */
const ALLOWED_IGNS = JSON.parse(fs.readFileSync("./data/igns.json"));
let USED_IGNS = fs.existsSync("./data/used_igns.json")
  ? JSON.parse(fs.readFileSync("./data/used_igns.json"))
  : [];

/* ================= SETUP UI ================= */
async function setupVerification(client) {
  const channel = await client.channels.fetch(CHANNEL_ID);

  await channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor(0x9fe7ff)
        .setTitle("❄️ FROSTMOON TERMINAL")
        .setDescription("Click below to begin awakening process.")
    ],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("fm_start")
          .setLabel("Enter Gate")
          .setStyle(ButtonStyle.Primary)
      )
    ]
  });
}

/* ================= INTERACTIONS ================= */
async function handleInteraction(interaction, client) {

  /* BUTTON */
  if (interaction.isButton() && interaction.customId === "fm_start") {
    const modal = new ModalBuilder()
      .setCustomId("fm_modal")
      .setTitle("Frostmoon Scan");

    const ign = new TextInputBuilder()
      .setCustomId("ign")
      .setLabel("Enter IGN")
      .setStyle(TextInputStyle.Short);

    modal.addComponents(new ActionRowBuilder().addComponents(ign));

    return interaction.showModal(modal);
  }

  /* MODAL */
  if (interaction.isModalSubmit() && interaction.customId === "fm_modal") {

    const ign = interaction.fields.getTextInputValue("ign").toLowerCase();
    const member = await interaction.guild.members.fetch(interaction.user.id);

    await interaction.deferReply({ ephemeral: true });

    if (!ALLOWED_IGNS.includes(ign))
      return interaction.editReply("🚫 Invalid IGN");

    if (USED_IGNS.find(u => u.ign === ign))
      return interaction.editReply("🔒 Already used");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`fm_confirm_${ign}`)
        .setLabel("Confirm")
        .setStyle(ButtonStyle.Success)
    );

    return interaction.editReply({
      content: "Confirm identity",
      components: [row]
    });
  }

  /* CONFIRM */
  if (interaction.isButton() && interaction.customId.startsWith("fm_confirm_")) {

    const ign = interaction.customId.replace("fm_confirm_", "");
    const member = await interaction.guild.members.fetch(interaction.user.id);

    await member.roles.add(ROLE_KHANRIAN);
    await member.roles.remove(ROLE_WANDERER);

    USED_IGNS.push({ ign, userId: member.id });
    fs.writeFileSync("./data/used_igns.json", JSON.stringify(USED_IGNS, null, 2));

    return interaction.update({
      content: "❄️ Verified",
      components: []
    });
  }
}

module.exports = { setupVerification, handleInteraction };
