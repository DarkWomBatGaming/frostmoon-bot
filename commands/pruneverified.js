const { audit } = require("../services/auditService");
const { updateRoster } = require("../services/rosterService");
const { readJson, writeJsonAtomic } = require("../utils/storage");

const USED_FILE = "./data/used_igns.json";

module.exports = {
  name: "pruneverified",
  description: "Remove verified entries for users no longer in the server.",

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const used = readJson(USED_FILE, []);
    let removed = 0;

    const kept = [];
    for (const u of used) {
      const id = String(u?.userId || "").trim();
      if (!id) continue;

      const member = await interaction.guild.members.fetch(id).catch(() => null);
      if (!member) {
        removed++;
        continue;
      }
      kept.push(u);
    }

    writeJsonAtomic(USED_FILE, kept);
    await updateRoster(interaction.guild);

    await audit(interaction, {
      title: "Prune verified users",
      description: `Removed **${removed}** entries not in server.`
    });

    return interaction.editReply(`✅ Pruned **${removed}** entries. Roster refreshed.`);
  }
};
