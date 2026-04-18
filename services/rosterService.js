const { EmbedBuilder } = require("discord.js");
const fs = require("fs");
const config = require("../config");

const LOCK_FILE = "./data/ui_lock.json";

async function updateRoster(guild) {
  const channel = await guild.channels.fetch(config.CHANNEL_ID);

  await guild.members.fetch(); // FIXES CACHE BUG

  const count = guild.members.cache.filter(m =>
    m.roles.cache.has(config.ROLE_KHANRIAN)
  ).size;

  const embed = new EmbedBuilder()
    .setColor(0x132f4c)
    .setTitle("📊 LIVE ROSTER")
    .setDescription(
      `\`\`\`yaml\nACTIVE_MEMBERS: ${count}\nSTATUS: STABLE\n\`\`\``
    );

  let msg = null;

  if (fs.existsSync(LOCK_FILE)) {
    try {
      const lock = JSON.parse(fs.readFileSync(LOCK_FILE));
      if (lock.rosterId) {
        msg = await channel.messages.fetch(lock.rosterId).catch(() => null);
      }
    } catch {
      console.error("⚠️ Failed to read ui_lock.json; roster message will be sent fresh.");
    }
  }

  if (msg) {
    await msg.edit({ embeds: [embed] });
  } else {
    await channel.send({ embeds: [embed] });
  }
}

module.exports = { updateRoster };
