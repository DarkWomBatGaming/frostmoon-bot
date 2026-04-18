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
  name: "listnames",
  description: "List verified IGNs (names) from used_igns.json (admin).",

  async execute(interaction) {
    if (!interaction.member.permissions.has("Administrator")) {
      return interaction.reply({ content: "❌ Admin only", ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    const used = readUsed();
    const igns = used
      .map(u => String(u?.ign ?? "").trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    if (igns.length === 0) {
      return interaction.editReply("No IGNs found yet.");
    }

    const lines = igns.map((ign, i) => `${i + 1}. **${ign}**`);
    const pages = chunk(lines, 40);

    await interaction.editReply(`**Verified IGNs (${igns.length})**\n` + pages[0].join("\n"));
    for (let i = 1; i < pages.length; i++) {
      await interaction.followUp({
        ephemeral: true,
        content: `**Verified IGNs (${igns.length}) (page ${i + 1}/${pages.length})**\n` + pages[i].join("\n")
      });
    }
  }
};
