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
  name: "addign",
  description: "Add an allowed IGN (admin).",
  options: [
    {
      name: "ign",
      description: "IGN to add",
      type: 3, // STRING
      required: true
    }
  ],

  async execute(interaction) {
    if (!interaction.member.permissions.has("Administrator")) {
      return interaction.reply({ content: "❌ Admin only", ephemeral: true });
    }

    const ignRaw = interaction.options.getString("ign");
    const ign = String(ignRaw).trim();
    const ignLower = ign.toLowerCase();

    if (!ign) {
      return interaction.reply({ content: "❌ IGN cannot be empty.", ephemeral: true });
    }

    const igns = readIgns();
    const exists = igns.some(x => String(x).toLowerCase() === ignLower);
    if (exists) {
      return interaction.reply({ content: `⚠️ IGN **${ign}** is already in the allowed list.`, ephemeral: true });
    }

    igns.push(ign);
    writeIgns(igns);

    return interaction.reply({
      content: `✅ Added allowed IGN: **${ign}**`,
      ephemeral: true
    });
  }
};
