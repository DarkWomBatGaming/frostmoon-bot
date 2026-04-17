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
  Events,
  PermissionsBitField
} = require("discord.js");

const express = require("express");
const fs = require("fs");

/* ================= EXPRESS ================= */
const app = express();
app.get("/", (_, res) => res.send("Frostmoon System Online"));
app.listen(process.env.PORT || 3000);

/* ================= DATA ================= */
const igns = JSON.parse(fs.readFileSync("./igns.json", "utf8"))
  .map(i => i.toLowerCase());

const cooldown = new Map();

/* ================= IDS ================= */
const GUILD_ID = "1493669690088882187";
const STATUS_CHANNEL_ID = "1494055445596209172";
const LOG_CHANNEL_ID = "1494753217362399384";

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
client.once("ready", async () => {
  console.log(`❄️ Logged in as ${client.user.tag}`);

  const guild = client.guilds.cache.get(GUILD_ID);
  const channel = await client.channels.fetch(STATUS_CHANNEL_ID);

  /* ===== Ensure TWO fixed messages exist ===== */
  const messages = await channel.messages.fetch({ limit: 10 });

  let countMsg = messages.find(m => m.author.id === client.user.id && m.embeds[0]?.title === "📊 FROSTMOON ROSTER");
  let terminalMsg = messages.find(m => m.author.id === client.user.id && m.embeds[0]?.title === "❄️ FROSTMOON VERIFICATION TERMINAL");

  if (!countMsg) {
    countMsg = await channel.send({ embeds: [createCountEmbed(0)] });
  }

  if (!terminalMsg) {
    terminalMsg = await channel.send({
      embeds: [createTerminalEmbed()],
      components: [terminalButtons()]
    });
  }

  await recountTeam(guild);
});

/* ================= INTERACTIONS ================= */
client.on(Events.InteractionCreate, async interaction => {

  /* ===== STEP 1: START WIZARD ===== */
  if (interaction.isButton() && interaction.customId === "wizard_start") {
    const modal = new ModalBuilder()
      .setCustomId("wizard_step_ign")
      .setTitle("Frostmoon Identity Input");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("ign")
          .setLabel("Enter your In-Game Name")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      )
    );

    return interaction.showModal(modal);
  }

  /* ===== STEP 2: IGN SUBMIT ===== */
  if (interaction.isModalSubmit() && interaction.customId === "wizard_step_ign") {
    const ign = interaction.fields.getTextInputValue("ign").toLowerCase();

    if (!igns.includes(ign)) {
      return interaction.reply({ content: "🚫 Cryo signature not recognized.", ephemeral: true });
    }

    const confirmRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`wizard_confirm_${ign}`)
        .setLabel("Confirm Authorization")
        .setStyle(ButtonStyle.Success)
        .setEmoji("❄️")
    );

    return interaction.reply({
      content: "🧬 IGN recognized. Confirm to proceed.",
      components: [confirmRow],
      ephemeral: true
    });
  }

  /* ===== STEP 3: CONFIRM ===== */
  if (interaction.isButton() && interaction.customId.startsWith("wizard_confirm_")) {
    const ign = interaction.customId.replace("wizard_confirm_", "");
    const userId = interaction.user.id;

    if (cooldown.has(userId)) {
      return interaction.reply({ content: "⏳ Frostmoon systems cooling down...", ephemeral: true });
    }

    cooldown.set(userId, true);
    setTimeout(() => cooldown.delete(userId), 10000);

    await interaction.deferReply({ ephemeral: true });

    const stages = [
      "❄️ Initializing Cryo Matrix...",
      "📡 Syncing Ley-Line Data...",
      "🧠 Verifying Identity...",
      "🔓 Granting Clearance..."
    ];

    for (let i = 0; i < stages.length; i++) {
      setTimeout(() => interaction.editReply(stages[i]), i * 900);
    }

    setTimeout(async () => {
      const member = await interaction.guild.members.fetch(userId);
      if (member.roles.cache.has(ROLE_KHANRIAN)) {
        return interaction.editReply("🛡️ Already authorized.");
      }

      await member.roles.remove(ROLE_WANDERER).catch(() => {});
      await member.roles.add(ROLE_KHANRIAN);

      await interaction.editReply({
        embeds: [successEmbed(interaction.user, ign)]
      });

      await logJoin(interaction.guild, interaction.user, ign);
      await recountTeam(interaction.guild);
    }, 3800);
  }
});

/* ================= MEMBER LEAVE ================= */
client.on(Events.GuildMemberRemove, async member => {
  if (!member.roles.cache.has(ROLE_KHANRIAN)) return;
  await recountTeam(member.guild);
});

/* ================= HELPERS ================= */

function createCountEmbed(count) {
  return new EmbedBuilder()
    .setColor(0x9fe7ff)
    .setTitle("📊 FROSTMOON ROSTER")
    .setDescription(`**Active Khanrians:**\n\n# ❄️ ${count}`)
    .setFooter({ text: "Live Frostmoon Census" });
}

function createTerminalEmbed() {
  return new EmbedBuilder()
    .setColor(0x9fe7ff)
    .setTitle("❄️ FROSTMOON VERIFICATION TERMINAL")
    .setDescription(
      "```ansi\n\u001b[1;36mSYSTEM ONLINE\u001b[0m\n\u001b[2;37mAWAITING AUTHORIZATION...\u001b[0m\n```"
    )
    .setFooter({ text: "Frostmoon Security Core" });
}

function terminalButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("wizard_start")
      .setLabel("Begin Verification")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("❄️")
  );
}

function successEmbed(user, ign) {
  return new EmbedBuilder()
    .setColor(0x9fe7ff)
    .setTitle("❄️ CLEARANCE GRANTED")
    .setDescription(
      "```diff\n+ CRYO SIGNATURE CONFIRMED\n+ STATUS: KHANRIAN\n```"
    )
    .addFields(
      { name: "Agent", value: `<@${user.id}>`, inline: true },
      { name: "IGN", value: ign, inline: true }
    )
    .setThumbnail(user.displayAvatarURL())
    .setTimestamp();
}

async function recountTeam(guild) {
  const channel = await guild.channels.fetch(STATUS_CHANNEL_ID);
  const messages = await channel.messages.fetch({ limit: 10 });

  const count = guild.members.cache.filter(m =>
    m.roles.cache.has(ROLE_KHANRIAN)
  ).size;

  const countMsg = messages.find(m => m.embeds[0]?.title === "📊 FROSTMOON ROSTER");
  if (countMsg) {
    await countMsg.edit({ embeds: [createCountEmbed(count)] });
  }
}

async function logJoin(guild, user, ign) {
  const log = await guild.channels.fetch(LOG_CHANNEL_ID);
  await log.send({
    embeds: [
      new EmbedBuilder()
        .setColor(0x9fe7ff)
        .setTitle("📜 Frostmoon Authorization Log")
        .setDescription(`User: <@${user.id}>\nIGN: \`${ign}\``)
        .setTimestamp()
    ]
  });
}

client.login(process.env.TOKEN);
