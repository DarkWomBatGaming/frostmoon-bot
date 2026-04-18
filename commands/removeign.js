const fs = require("fs");

const IGNS_FILE = "./data/igns.json";

function ensureDataDir() {
  if (!fs.existsSync("./data")) fs.mkdirSync("./data", { recursive: true });
}

function readIgns() {
  ensureDataDir();
  if (!fs.existsSync(IGNS_FILE)) fs.writeFileSync(IGNS_FILE, "[]");
  const data = JSON.parse(fs.readFileSync(IGNS_FILE, "utf8"));
  if (!Array.isArray(data)) return [];
  return data.map(x => String(x));
}

function writeIgns(list) {
  ensureDataDir();
  fs.writeFileSync(IGNS_FILE, JSON.stringify(list, null, 2));
}

module.exports = {
  name: "removeign",
  description: "Remove an allowed IGN (admin).",
  options: [
    {
      name: "ign",
      description: "IGN to remove",
      type: 3, // STRING
      required: true
    }
  ],

  async execute(interaction) {
    if (!interaction.member.permissions.has("Administrator")) {
      return interaction.reply({ content: "❌ Admin only", ephemeral: true });
    }

    const ignRaw = interaction.options.getString("ign");
    const ignLower = String(ignRaw).trim().toLowerCase();

    if (!ignLower) {
      return interaction.reply({ content: "❌ IGN cannot be empty.", ephemeral: true });
    }

    const igns = readIgns();
    const before = igns.length;

    const filtered = igns.filter(x => String(x).toLowerCase() !== ignLower);

    if (filtered.length === before) {
      return interaction.reply({ content: `❌ IGN not found in allowed list: **${ignRaw}**`, ephemeral: true });
    }

    writeIgns(filtered);

    return interaction.reply({
      content: `✅ Removed allowed IGN: **${ignRaw}**`,
      ephemeral: true
    });
  }
};
