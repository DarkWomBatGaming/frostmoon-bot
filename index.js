const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  Events,
  PermissionsBitField
} = require("discord.js");

const express = require("express");
const fs = require("fs");

/* ================= KEEP ALIVE ================= */
const app = express();
app.get("/", (_, res) => res.send("Frostmoon System Online"));
app.listen(process.env.PORT || 3000);

/* ================= FILES ================= */
const ALLOWED_IGNS = JSON.parse(fs.readFileSync("./igns.json", "utf8"))
  .map(i => i.toLowerCase());

let USED_IGNS = fs.existsSync("./used_igns.json")
  ? JSON.parse(fs.readFileSync("./used_igns.json", "utf8"))
  : []; // { ign, userId }

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

/* ================= READY ================= */
client.once("ready", async () => {
  console.log(`❄️ Logged in as ${client.user.tag}`);

  const guild = client.guilds.cache.get(GUILD_ID);

  /* ----- Register Slash Commands ----- */
  await guild.commands.set([
    {
      name: "setcount",
      description: "Manually set Frostmoon team count",
      options: [{
        name: "number",
        type: 4,
        required: true,
        description: "Team size"
      }]
    },
    {
      name: "teamlist",
      description: "List all Frostmoon team members (Admin only)"
    },
    {
      name: "removeign",
      description: "Remove an IGN from used list (Admin only)",
      options: [{
        name: "ign",
        type: 3,
        required: true,
        description: "IGN to remove"
      }]
    }
  ]);

  const channel = await guild.channels.fetch(REALM_CHANNEL_ID);

  /* ----- Clean bot messages ----- */
  const messages = await channel.messages.fetch({ limit: 50 });
  for (const msg of messages.values()) {
    if (msg.author.id === client.user.id) {
      await msg.delete().catch(() => {});
    }
  }

  await channel.send({ embeds: [createCountEmbed(0)] });
  await recountTeam(guild);
});

/* ================= SLASH COMMANDS ================= */
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  /* ----- ADMIN CHECK ----- */
  const isAdmin = interaction.member.permissions.has(
    PermissionsBitField.Flags.Administrator
  );

  /* /setcount */
  if (interaction.commandName === "setcount") {
    if (!isAdmin) {
      return interaction.reply({ content: "❌ Admin only.", ephemeral: true });
    }

    const number = interaction.options.getInteger("number");
    const channel = await interaction.guild.channels.fetch(REALM_CHANNEL_ID);
    const messages = await channel.messages.fetch({ limit: 10 });

    const countMsg = messages.find(m => m.embeds[0]?.title === "📊 FROSTMOON ROSTER");
    if (countMsg) {
      await countMsg.edit({ embeds: [createCountEmbed(number)] });
    }

    return interaction.reply({ content: "✅ Team count updated.", ephemeral: true });
  }

  /* /teamlist */
  if (interaction.commandName === "teamlist") {
    if (!isAdmin) {
      return interaction.reply({ content: "❌ Admin only.", ephemeral: true });
    }

    if (USED_IGNS.length === 0) {
      return interaction.reply({
        content: "❄️ No verified members yet.",
        ephemeral: true
      });
    }

    const list = USED_IGNS
      .map((e, i) => `${i + 1}. <@${e.userId}> — \`${e.ign}\``)
      .join("\n");

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x9fe7ff)
          .setTitle("📜 Frostmoon Team List")
          .setDescription(list)
      ],
      ephemeral: true
    });
  }

  /* /removeign */
  if (interaction.commandName === "removeign") {
    if (!isAdmin) {
      return interaction.reply({ content: "❌ Admin only.", ephemeral: true });
    }

    const ign = interaction.options.getString("ign").toLowerCase();
    const index = USED_IGNS.findIndex(e => e.ign === ign);

    if (index === -1) {
      return interaction.reply({
        content: "🚫 IGN not found in used list.",
        ephemeral: true
      });
    }

    USED_IGNS.splice(index, 1);
    fs.writeFileSync("./used_igns.json", JSON.stringify(USED_IGNS, null, 2));

    return interaction.reply({
      content: `♻️ IGN \`${ign}\` has been released.`,
      ephemeral: true
    });
  }
});

/* ================= MESSAGE-BASED VERIFICATION ================= */
client.on(Events.MessageCreate, async message => {
  if (message.channel.id !== REALM_CHANNEL_ID) return;
  if (message.author.bot) return;

  const ign = message.content.toLowerCase();
  await message.delete().catch(() => {});

  const member = await message.guild.members.fetch(message.author.id);

  if (member.roles.cache.has(ROLE_KHANRIAN)) {
    return message.author.send(
      "❄️ You are already part of the Frostmoon team."
    ).catch(() => {});
  }

  if (!ALLOWED_IGNS.includes(ign)) {
    return message.author.send(
      "🚫 Cryo signature not recognized."
    ).catch(() => {});
  }

  if (USED_IGNS.some(e => e.ign === ign)) {
    return message.author.send(
      "🔒 This IGN has already been claimed."
    ).catch(() => {});
  }

  await member.roles.remove(ROLE_WANDERER).catch(() => {});
  await member.roles.add(ROLE_KHANRIAN);

  USED_IGNS.push({ ign, userId: member.id });
  fs.writeFileSync("./used_igns.json", JSON.stringify(USED_IGNS, null, 2));

  await message.author.send(
    "❄️ Verification successful. Welcome to Frostmoon."
  ).catch(() => {});

  await logJoin(message.guild, member.user, ign);
  await recountTeam(message.guild);
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
    .setDescription(`# ❄️ ${count}`)
    .setFooter({ text: "Live Frostmoon Census" });
}

async function recountTeam(guild) {
  const channel = await guild.channels.fetch(REALM_CHANNEL_ID);
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
