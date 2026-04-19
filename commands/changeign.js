const { audit } = require("../services/auditService");
const { updateRoster } = require("../services/rosterService");
const { readJson, writeJsonAtomic } = require("../utils/storage");

const USED_FILE = "./data/used_igns.json";

module.exports = {
  name: "changeign",
  description: "Change a verified user's IGN in used_igns.json.",
  options: [
    { name: "user", description: "User to edit", type: 6, required: true },
    { name: "new_ign", description: "New IGN", type: 3, required: true }
  ],

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const user = interaction.options.getUser("user");
    const newIgn = String(interaction.options.getString("new_ign")).trim();
    const newIgnLower = newIgn.toLowerCase();

    if (!newIgn) return interaction.editReply("❌ new_ign cannot be empty.");

    const used = readJson(USED_FILE, []);
    const idx = used.findIndex(u => String(u?.userId) === String(user.id));

    if (idx === -1) return interaction.editReply("❌ That user is not verified in used_igns.json.");

    // prevent duplicate ign
    const duplicate = used.find(u => String(u?.ign || "").toLowerCase() === newIgnLower && String(u?.userId) !== String(user.id));
    if (duplicate) return interaction.editReply("❌ That IGN is already used by another verified user.");

    const oldIgn = used[idx].ign;
    used[idx].ign = newIgn;

    writeJsonAtomic(USED_FILE, used);
    await updateRoster(interaction.guild);

    await audit(interaction, {
      title: "Change IGN",
      description: `Changed IGN for <@${user.id}>.`,
      fields: [
        { name: "Old IGN", value: String(oldIgn || "unknown"), inline: true },
        { name: "New IGN", value: newIgn, inline: true }
      ]
    });

    return interaction.editReply(`✅ Changed <@${user.id}>'s IGN from **${oldIgn}** to **${newIgn}**.`);
  }
};
