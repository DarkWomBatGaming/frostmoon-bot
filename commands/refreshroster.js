const { updateRoster } = require("../services/rosterService");

module.exports = {
  name: "refreshroster",
  description: "Force refresh the roster message (admin).",

  async execute(interaction) {
    if (!interaction.member.permissions.has("Administrator")) {
      return interaction.reply({ content: "❌ Admin only", ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    await updateRoster(interaction.guild);

    return interaction.editReply("✅ Roster refreshed.");
  }
};
