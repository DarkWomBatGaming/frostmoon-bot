module.exports = {
  name: "setcount",
  description: "Set team count",
  options: [
    {
      name: "number",
      type: 4,
      required: true,
      description: "New count"
    }
  ],

  async execute(interaction, ctx) {
    if (!interaction.member.permissions.has("Administrator")) {
      return interaction.reply({ content: "❌ Admin only", ephemeral: true });
    }

    const number = interaction.options.getInteger("number");

    const channel = await interaction.guild.channels.fetch(ctx.REALM_CHANNEL_ID);
    const messages = await channel.messages.fetch({ limit: 10 });

    const msg = messages.find(m => m.embeds[0]?.title === "📊 FROSTMOON ROSTER");
    if (msg) await msg.edit({ embeds: [ctx.createCountEmbed(number)] });

    interaction.reply({ content: "✅ Updated", ephemeral: true });
  }
};
