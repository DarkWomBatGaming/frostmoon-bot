module.exports = {
  name: "interactionCreate",

  async execute(interaction, client) {
    const command = client.commands.get(interaction.commandName);

    if (interaction.isChatInputCommand()) {
      if (!command) return;
      await command.execute(interaction, client);
    }

    const verify = require("../services/verificationService");
    await verify.handleInteraction(interaction, client);
  }
};
