const verify = require("../services/verificationService");

module.exports = {
  name: "interactionCreate",

  async execute(interaction) {
    await verify.handleInteraction(interaction);
  }
};
