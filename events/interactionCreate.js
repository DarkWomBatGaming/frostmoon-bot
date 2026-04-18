const fs = require("fs");
const path = require("path");
const verify = require("../services/verificationService");

function loadCommand(name) {
  const file = path.join(__dirname, "..", "commands", `${name}.js`);
  if (!fs.existsSync(file)) return null;

  // optional: makes command edits apply without full restart
  delete require.cache[require.resolve(file)];
  return require(file);
}

module.exports = {
  name: "interactionCreate",

  async execute(interaction) {
    try {
      // ✅ SLASH COMMANDS
      if (interaction.isChatInputCommand()) {
        const cmd = loadCommand(interaction.commandName);

        if (!cmd || typeof cmd.execute !== "function") {
          return interaction.reply({
            content: "❌ Command handler not found on bot.",
            ephemeral: true
          });
        }

        return cmd.execute(interaction);
      }

      // ✅ BUTTONS / MODALS (verification UI)
      return verify.handleInteraction(interaction);
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
