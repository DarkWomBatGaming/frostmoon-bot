const fs = require("fs");

const IGNS_FILE = "./data/igns.json";

function ensureDataDir() {
  if (!fs.existsSync("./data")) fs.mkdirSync("./data", { recursive: true });
}

function readIgns() {
  ensureDataDir();
  if (!fs.existsSync(IGNS_FILE)) fs.writeFileSync(IGNS_FILE, "[]");
  try {
    const data = JSON.parse(fs.readFileSync(IGNS_FILE, "utf8"));
    if (!Array.isArray(data)) return [];
    return data.map(x => String(x).trim()).filter(Boolean);
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
  description: "List all allowed IGNs from igns.json (admin).",

  async execute(interaction) {
    if (!interaction.member.permissions.has("Administrator")) {
      return interaction.reply({ content: "❌ Admin only", ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    const igns = readIgns().sort((a, b) => a.localeCompare(b));

    if (igns.length === 0) {
      return interaction.editReply("No names found in igns.json yet.");
    }

    const lines = igns.map((ign, i) => `${i + 1}. **${ign}**`);
    const pages = chunk(lines, 40);

    await interaction.editReply(`**Allowed IGNs (${igns.length})**\n` + pages[0].join("\n"));
    for (let i = 1; i < pages.length; i++) {
      await interaction.followUp({
        ephemeral: true,
        content: `**Allowed IGNs (${igns.length}) (page ${i + 1}/${pages.length})**\n` + pages[i].join("\n")
      });
    }
  }
};
