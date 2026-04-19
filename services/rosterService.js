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

    // Small server: fetch everyone + presences so member.presence is available
  await guild.members.fetch({ withPresences: true }).catch(() => {});

  const used = readUsed();

  const verifiedIds = [
    ...new Set(
      used.map(u => String(u?.userId || "").trim()).filter(Boolean)
    )
  ];

  const total = verifiedIds.length;

  let online = 0;
  let offline = 0;
  let unknown = 0;
  let notInServer = 0;

  for (const id of verifiedIds) {
    // fetch member so presence can populate when available
    let member = guild.members.cache.get(id) || null;
    if (!member) member = await guild.members.fetch(id).catch(() => null);

    if (!member) {
      notInServer++;
      continue;
    }

    const status = member.presence?.status; // 'online'|'idle'|'dnd'|'offline'

    if (!status) {
      unknown++;
      continue;
    }

    if (status === "offline") offline++;
    else online++;
  }

  const embed = new EmbedBuilder()
    .setColor(0x132f4c)
    .setTitle("📊 Live Roster")
    .setDescription("Verified members detected.")
    .addFields(
      { name: "Total Members", value: `**${total}**`, inline: true },
      { name: "Online (Active)", value: `**${online}**`, inline: true },
      { name: "Offline", value: `**${offline}**`, inline: true },
      { name: "Unknown", value: `**${unknown}**`, inline: true },
      { name: "Not in Server", value: `**${notInServer}**`, inline: true }
    )
    .setThumbnail(ICON_URL)
    .setFooter({ text: "• Auto-updated • Active = Online presence" });

  let rosterMsg = null;
  let lock = null;

  try {
    lock = JSON.parse(fs.readFileSync(LOCK_FILE, "utf8"));
    if (lock?.rosterId) {
      rosterMsg = await channel.messages.fetch(lock.rosterId).catch(() => null);
    }
  } catch {
    lock = null;
  }

  if (rosterMsg) {
    await rosterMsg.edit({ embeds: [embed] });
  } else {
    const msg = await channel.send({ embeds: [embed] });

    ensureDataDir();
    const nextLock = { ...(lock || {}), rosterId: msg.id };
    fs.writeFileSync(LOCK_FILE, JSON.stringify(nextLock, null, 2));
  }
}

module.exports = { updateRoster };
