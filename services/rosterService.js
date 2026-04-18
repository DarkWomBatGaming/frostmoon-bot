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

  const ICON_URL =
  "https://cdn.discordapp.com/attachments/1479200956209041613/1495040536086712381/frostmoon_icon.webp?ex=69e4cc80&is=69e37b00&hm=f0c70ec1228c3826ba5345b37426b928ac80ce0b7f21b7ecb61830934f11eea0";

const embed = new EmbedBuilder()
  .setColor(0x132f4c)
  .setTitle("📊 Live Roster")
  .setDescription("Current verified members (cache-based).")
  .addFields(
    { name: "Active Members", value: `**${count}**`, inline: true },
    { name: "Status", value: "Stable", inline: true }
  )
  .setThumbnail(ICON_URL)
  .setFooter({ text: "Updates automatically • Count may be slightly delayed" });
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
