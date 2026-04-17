const { setupVerification } = require("../services/verificationService");
const { updateRoster } = require("../services/rosterService");

module.exports = {
  name: "ready",
  once: true,

  async execute(client) {
    console.log(`❄️ Logged in as ${client.user.tag}`);

    await setupVerification(client);

    const guild = client.guilds.cache.first();
    if (guild) await updateRoster(guild);
  }
};
