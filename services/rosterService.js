const { EmbedBuilder } = require("discord.js");
const config = require("../config");

async function updateRoster(guild) {
  const channel = await guild.channels.fetch(config.CHANNEL_ID);

  await guild.members.fetch(); // FIXES CACHE BUG

  const count = guild.members.cache.filter(m =>
    m.roles.cache.has(config.ROLE_KHANRIAN)
  ).size;

  const messages = await channel.messages.fetch({ limit: 50 });

  let msg = messages.find(m =>
    m.embeds[0]?.title === "📊 FROSTMOON ROSTER"
  );

  cconst embed = new EmbedBuilder()
  .setColor(0x132f4c)
  .setTitle("📊 LIVE ROSTER")
  .setDescription(
    `\`\`\`yaml\nACTIVE_MEMBERS: ${count}\nSTATUS: STABLE\n\`\`\``
  );

 const lock = JSON.parse(fs.readFileSync("./data/ui_lock.json"));

const msg = await channel.messages.fetch(lock.rosterId).catch(() => null);

if (msg) {
  await msg.edit({ embeds: [embed] });
} else {
  await channel.send({ embeds: [embed] });
}

module.exports = { updateRoster };
