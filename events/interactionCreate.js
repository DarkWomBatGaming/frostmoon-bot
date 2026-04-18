const verify = require("../services/verificationService");

module.exports = {
  name: "interactionCreate",

  async execute(interaction) {
    try {
      await verify.handleInteraction(interaction);
    } catch (err) {
      console.error("interactionCreate handler error:", err);

      // Try to reply something (don't throw if it fails)
      if (interaction.isRepliable()) {
        const msg = "❌ Something went wrong processing that interaction.";
        if (interaction.deferred || interaction.replied) {
          await interaction.followUp({ content: msg, ephemeral: true }).catch(() => {});
        } else {
          await interaction.reply({ content: msg, ephemeral: true }).catch(() => {});
        }
      }
    }
  }
};
