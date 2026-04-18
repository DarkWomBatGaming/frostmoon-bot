const { setupVerification } = require("../services/verificationService");

module.exports = {
  name: "clientReady", // v15+ uses clientReady (v14 still supports ready; this avoids warning)
  once: true,

  async execute(client) {
    console.log(`❄️ Logged in as ${client.user.tag}`);

    try {
      await setupVerification(client);
    } catch (err) {
      console.error("setupVerification failed:", err);
    }
  }
};
