const { readJson } = require("../utils/storage");
const USED_FILE = "./data/used_igns.json";

module.exports = {
  name: "whois",
  description: "Find a verified user by IGN.",
  options: [{ name: "ign", description: "IGN to search", type: 3, required: true }],

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const ign = String(interaction.options.getString("ign")).trim().toLowerCase();
    const used = readJson(USED_FILE, []);

    const hit = used.find(u => String(u?.ign || "").toLowerCase() === ign);
    if (!hit) return interaction.editReply("❌ No verified user found with that IGN.");

    return interaction.editReply(`✅ **${hit.ign}** belongs to <@${hit.userId}> (${hit.userId}).`);
  }
};
