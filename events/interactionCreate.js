const fs = require("fs");
const path = require("path");
const verify = require("../services/verificationService");

// ====== ACCESS CONTROL SETTINGS ======
const COMMAND_ACCESS_ROLE_ID = "1493694849776615664";

// Put YOUR Discord user ID(s) here so you can always use commands
// (Developer Mode -> click your profile -> Copy ID)
const OWNER_USER_IDS = [
  // "123456789012345678",
];
// =====================================

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
        const isOwner = OWNER_USER_IDS.includes(interaction.user.id);

        // interaction.member is a GuildMember for guild slash commands
        const hasAccessRole =
          interaction.inGuild() &&
          interaction.member?.roles?.cache?.has(COMMAND_ACCESS_ROLE_ID);

        if (!isOwner && !hasAccessRole) {
          return interaction.reply({
            content: "❌ You are not allowed to use Frostmoon bot commands.",
            ephemeral: true
          });
        }

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
      // (Left open so verification still works for regular users)
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
