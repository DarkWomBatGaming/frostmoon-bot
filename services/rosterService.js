const fs = require("fs");
const { EmbedBuilder } = require("discord.js");
const config = require("../config");

const LOCK_FILE = "./data/ui_lock.json";

async function updateRoster(guild) {
  const channel = await guild.channels.fetch(config.CHANNEL_ID);

  // Make sure member cache is hydrated so role counts are accurate
  await guild.members.fetch();

  const count = guild.members.cache.filter(m =>
    m.roles.cache.has(config.ROLE_KHANRIAN)
  ).size;

  const embed = new EmbedBuilder()
    .setColor(0x132f4c)
    .setTitle("📊 LIVE ROSTER")
    .setDescription(`\`\`\`yaml\nACTIVE_MEMBERS: ${count}\nSTATUS: STABLE\n\`\`\``);

  // Prefer editing the known roster message created during setup
  let rosterMsg = null;
  try {
    const lock = JSON.parse(fs.readFileSync(LOCK_FILE, "utf8"));
    if (lock?.rosterId) {
      rosterMsg = await channel.messages.fetch(lock.rosterId).catch(() => null);
    }
  } catch {
    // ignore: lock file might not exist yet
  }

  if (rosterMsg) {
    await rosterMsg.edit({ embeds: [embed] });
  } else {
    await channel.send({ embeds: [embed] });
  }
}

module.exports = { updateRoster };
