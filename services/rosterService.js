const {
  EmbedBuilder
} = require("discord.js");

const CHANNEL_ID = "1494055445596209172";
const ROLE_KHANRIAN = "1493696754141626540";

/* ================= CREATE/UPDATE ROSTER ================= */
async function updateRoster(guild) {
  const channel = await guild.channels.fetch(CHANNEL_ID);

  const count = guild.members.cache.filter(m =>
    m.roles.cache.has(ROLE_KHANRIAN)
  ).size;

  const messages = await channel.messages.fetch({ limit: 20 });

  let msg = messages.find(m =>
    m.embeds[0]?.title === "📊 FROSTMOON ROSTER"
  );

  const embed = new EmbedBuilder()
    .setColor(0x9fe7ff)
    .setTitle("📊 FROSTMOON ROSTER")
    .setDescription(`❄️ Active Members: **${count}**`);

  if (msg) {
    await msg.edit({ embeds: [embed] });
  } else {
    await channel.send({ embeds: [embed] });
  }
}

module.exports = { updateRoster };
