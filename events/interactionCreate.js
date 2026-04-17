const verify = require("../services/verificationService");

module.exports = {
  name: "interactionCreate",

  async execute(interaction, client) {
    await verify.handleInteraction(interaction, client);
  }
};
