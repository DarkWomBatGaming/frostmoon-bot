const fs = require("fs");

const USED_FILE = "./data/used_igns.json";

function ensureDataDir() {
  if (!fs.existsSync("./data")) fs.mkdirSync("./data", { recursive: true });
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

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

module.exports = {
  name: "verifiedusers",
  description: "List verified users from used_igns.json (admin).",

  async execute(interaction) {
    if (!interaction.member.permissions.has("Administrator")) {
      return interaction.reply({ content: "❌ Admin only", ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    const used = readUsed();

    if (used.length === 0) {
      return interaction.editReply("No verified users found yet.");
    }

    // sort by IGN then by userId
    used.sort((a, b) =>
      String(a?.ign ?? "").localeCompare(String(b?.ign ?? "")) ||
      String(a?.userId ?? "").localeCompare(String(b?.userId ?? ""))
    );

    const lines = used.map((u, i) => {
      const ign = String(u?.ign ?? "unknown");
      const id = String(u?.userId ?? "");
      const mention = id ? `<@${id}>` : "(missing userId)";
      return `${i + 1}. ${mention} — **${ign}**`;
    });

    const pages = chunk(lines, 25);

    await interaction.editReply(`**Verified Users (${used.length})**\n` + pages[0].join("\n"));
    for (let i = 1; i < pages.length; i++) {
      await interaction.followUp({
        ephemeral: true,
        content: `**Verified Users (${used.length}) (page ${i + 1}/${pages.length})**\n` + pages[i].join("\n")
      });
    }
  }
};
