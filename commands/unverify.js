const config = require("../config");
const { updateRoster } = require("../services/rosterService");
const { audit } = require("../services/auditService");
const { readJson, writeJsonAtomic } = require("../utils/storage");

const USED_FILE = "./data/used_igns.json";

module.exports = {
  name: "unverify",
  description: "Remove a user from verified list (and remove Khanrian role).",
  options: [
    { name: "user", description: "User to unverify", type: 6, required: true },
    { name: "reason", description: "Optional reason", type: 3, required: false }
  ],

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const user = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason") || "No reason provided";

    const used = readJson(USED_FILE, []);
    const before = used.length;
    const filtered = used.filter(u => String(u?.userId) !== String(user.id));

    if (filtered.length === before) {
      return interaction.editReply("❌ That user is not in used_igns.json.");
    }

    writeJsonAtomic(USED_FILE, filtered);

    // Remove role if member exists
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (member) {
      await member.roles.remove(config.ROLE_KHANRIAN).catch(() => {});
      await member.roles.add(config.ROLE_WANDERER).catch(() => {});
    }

    await updateRoster(interaction.guild);

    await audit(interaction, {
      title: "Unverify user",
      description: `Removed verified entry for <@${user.id}>.`,
      fields: [{ name: "Reason", value: reason }]
    });

    return interaction.editReply(`✅ Unverified <@${user.id}> and updated roster.`);
  }
};
