const { updateRoster } = require("../services/rosterService");

await updateRoster(client.guilds.cache.first());

const { setupVerification } = require("../services/verificationService");

module.exports = {
  name: "ready",
  once: true,

  async execute(client) {
    console.log(`❄️ Logged in as ${client.user.tag}`);

    await setupVerification(client);
  }
};
