module.exports = {
  name: "removeign",
  description: "Remove an IGN",
  options: [
    {
      name: "ign",
      type: 3,
      required: true,
      description: "IGN"
    }
  ],

  async execute(interaction, ctx) {
    if (!interaction.member.permissions.has("Administrator")) {
      return interaction.reply({ content: "❌ Admin only", ephemeral: true });
    }

    const ign = interaction.options.getString("ign").toLowerCase();

    const index = ctx.USED_IGNS.findIndex(e => e.ign === ign);

    if (index === -1) {
      return interaction.reply({ content: "Not found", ephemeral: true });
    }

    ctx.USED_IGNS.splice(index, 1);
    ctx.fs.writeFileSync("./used_igns.json", JSON.stringify(ctx.USED_IGNS, null, 2));

    interaction.reply({ content: `Removed ${ign}`, ephemeral: true });
  }
};
