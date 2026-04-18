const fs = require("fs");
const { updateRoster } = require("../services/rosterService");

const OVERRIDE_FILE = "./data/roster_override.json";

module.exports = {
  name: "setcount",
  description: "Override the roster count (admin).",
  options: [
    {
      name: "count",
      description: "Roster count number (e.g. 10)",
      type: 4, // INTEGER
      required: true
    }
  ],

  async execute(interaction) {
    if (!interaction.member.permissions.has("Administrator")) {
      return interaction.reply({ content: "❌ Admin only", ephemeral: true });
    }

    const count = interaction.options.getInteger("count");
    if (count < 0 || count > 9999) {
      return interaction.reply({ content: "❌ Count must be between 0 and 9999.", ephemeral: true });
    }

    if (!fs.existsSync("./data")) fs.mkdirSync("./data", { recursive: true });
    fs.writeFileSync(OVERRIDE_FILE, JSON.stringify({ count }, null, 2));

    await updateRoster(interaction.guild);

    return interaction.reply({
      content: `✅ Roster override count set to **${count}**.`,
      ephemeral: true
    });
  }
};
