const { exec } = require("child_process");

module.exports = {
  name: "restartbot",
  description: "Restart the bot process via PM2 (admin).",

  async execute(interaction) {
    if (!interaction.member.permissions.has("Administrator")) {
      return interaction.reply({ content: "❌ Admin only", ephemeral: true });
    }

    await interaction.reply({ content: "♻️ Restarting bot via PM2...", ephemeral: true });

    // Change this if your PM2 process name is different
    const PM2_PROCESS_NAME = "frostmoon-bot";

    exec(`pm2 restart ${PM2_PROCESS_NAME} --update-env`, (err, stdout, stderr) => {
      // After restart, this process may die before responding again — that's OK.
      // We already replied. Logs are in pm2 logs.
    });
  }
};
