const fs = require("fs");
const { EmbedBuilder } = require("discord.js");
const config = require("../config");

const LOCK_FILE = "./data/ui_lock.json";

const ICON_URL =
  "https://cdn.discordapp.com/attachments/1479200956209041613/1495041778544541799/frostmoon_icon.jpg?ex=69e4cda8&is=69e37c28&hm=1b262b2ca95eae227d638b7a9757a2fcd9e1488e35deb9aace2b929b21d695d5";

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
    .setTitle("📊 Live Roster")
    .setDescription("Verified members detected.")
    .addFields(
      { name: "Active Members", value: `**${count}**`, inline: true },
      { name: "Status", value: "Stable", inline: true }
    )
    .setThumbnail(ICON_URL)
    .setFooter({ text: "Auto-updated • Cache-based count" });

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
