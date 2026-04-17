module.exports = {
  name: "removeuser",
  description: "Remove a user",
  options: [
    {
      name: "user",
      type: 6,
      required: true,
      description: "User"
    }
  ],

  async execute(interaction, ctx) {
    if (!interaction.member.permissions.has("Administrator")) {
      return interaction.reply({ content: "❌ Admin only", ephemeral: true });
    }

    const user = interaction.options.getUser("user");
    const member = await interaction.guild.members.fetch(user.id);

    await member.roles.remove(ctx.ROLE_KHANRIAN).catch(() => {});

    const index = ctx.USED_IGNS.findIndex(e => e.userId === user.id);

    let ign = null;
    if (index !== -1) {
      ign = ctx.USED_IGNS[index].ign;
      ctx.USED_IGNS.splice(index, 1);
      ctx.fs.writeFileSync("./used_igns.json", JSON.stringify(ctx.USED_IGNS, null, 2));
    }

    await ctx.recountTeam(interaction.guild);

    interaction.reply({
      content: `Removed <@${user.id}> ${ign ? `(freed ${ign})` : ""}`,
      ephemeral: true
    });
  }
};
