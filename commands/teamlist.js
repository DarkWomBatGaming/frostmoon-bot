module.exports = {
  name: "teamlist",
  description: "List all team members",

  async execute(interaction, ctx) {
    if (!interaction.member.permissions.has("Administrator")) {
      return interaction.reply({ content: "❌ Admin only", ephemeral: true });
    }

    if (ctx.USED_IGNS.length === 0) {
      return interaction.reply({ content: "No members", ephemeral: true });
    }

    const list = ctx.USED_IGNS
      .map((e, i) => `${i + 1}. <@${e.userId}> — ${e.ign}`)
      .join("\n");

    interaction.reply({ content: list, ephemeral: true });
  }
};
