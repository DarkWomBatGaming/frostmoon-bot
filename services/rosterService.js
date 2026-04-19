const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");
const config = require("../config");

const LOCK_FILE = "./data/ui_lock.json";
const USED_FILE = path.join(__dirname, "..", "data", "used_igns.json");

const ICON_URL =
  "https://cdn.discordapp.com/attachments/1479200956209041613/1495041778544541799/frostmoon_icon.jpg?ex=69e4cda8&is=69e37c28&hm=1b262b2ca95eae227d638b7a9757a2fcd9e1488e35deb9aace2b929b21d695d5";

function ensureDataDir() {
  const dir = path.join(__dirname, "..", "data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readUsed() {
  ensureDataDir();
  if (!fs.existsSync(USED_FILE)) fs.writeFileSync(USED_FILE, "[]");
  try {
    const data = JSON.parse(fs.readFileSync(USED_FILE, "utf8"));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function updateRoster(guild) {
  const channel = await guild.channels.fetch(config.CHANNEL_ID);

  // --- verified list ---
  const used = readUsed();
  const verifiedIds = used
    .map(u => String(u?.userId || "").trim())
    .filter(Boolean);

  const total = verifiedIds.length;

  // --- active within verified list = has Khanrian role ---
  let active = 0;
  for (const id of verifiedIds) {
    const member = guild.members.cache.get(id);
    if (member && member.roles.cache.has(config.ROLE_KHANRIAN)) active++;
  }

  const inactive = Math.max(0, total - active);

  const embed = new EmbedBuilder()
    .setColor(0x132f4c)
    .setTitle("📊 Live Roster")
    .setDescription("Verified members detected.")
    .addFields(
      { name: "Total Members", value: `**${total}**`, inline: true },
      { name: "Active Members", value: `**${active}**`, inline: true },
      { name: "Inactive Members", value: `**${inactive}**`, inline: true }
    )
    .setThumbnail(ICON_URL)
    .setFooter({ text: "• Auto-updated" });

  // --- your existing message update logic (using ui_lock.json) ---
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
    const msg = await channel.send({ embeds: [embed] });
    // If you want, save msg.id back into ui_lock.json here (depends on your current logic)
  }
}

module.exports = { updateRoster };
