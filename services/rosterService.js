const fs = require("fs");
const { EmbedBuilder } = require("discord.js");
const config = require("../config");

const LOCK_FILE = "./data/ui_lock.json";

async function updateRoster(guild) {
  const channel = await guild.channels.fetch(config.CHANNEL_ID);

  // DO NOT call guild.members.fetch() here — it can rate limit and crash the bot.
  // This count is cache-based (safe). If you need perfect accuracy, we can redesign
  // to store verified users in used_igns.json and count that instead.
  const count = guild.members.cache.filter(m =>
    m.roles.cache.has(config.ROLE_KHANRIAN)
  ).size;

  const embed = new EmbedBuilder()
    .setColor(0x132f4c)
    .setTitle("📊 LIVE ROSTER")
    .setDescription(`\`\`\`yaml\nACTIVE_MEMBERS: ${count}\nSTATUS: STABLE\n\`\`\``);

  let rosterMsg = null;
  try {
    const lock = JSON.parse(fs.readFileSync(LOCK_FILE, "utf8"));
    if (lock?.rosterId) {
      rosterMsg = await channel.messages.fetch(lock.rosterId).catch(() => null);
    }
  } catch {
    // ignore
  }

  if (rosterMsg) {
    await rosterMsg.edit({ embeds: [embed] });
  } else {
    await channel.send({ embeds: [embed] });
  }
}

module.exports = { updateRoster };
