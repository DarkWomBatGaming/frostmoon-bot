const { EmbedBuilder } = require("discord.js");
const config = require("../config");

async function audit(interactionOrGuild, payload) {
  try {
    const guild = interactionOrGuild.guild ?? interactionOrGuild;
    const channelId = config.AUDIT_CHANNEL_ID;
    if (!channelId) return;

    const ch = await guild.channels.fetch(channelId).catch(() => null);
    if (!ch) return;

    const embed = new EmbedBuilder()
      .setColor(0x2b2d31)
      .setTitle(payload.title || "Audit")
      .setDescription(payload.description || "")
      .setTimestamp(new Date());

    if (payload.fields?.length) embed.addFields(payload.fields);

    // who did it
    if (interactionOrGuild.user) {
      embed.addFields({
        name: "Actor",
        value: `<@${interactionOrGuild.user.id}> (${interactionOrGuild.user.id})`,
        inline: false
      });
    }

    await ch.send({ embeds: [embed] }).catch(() => {});
  } catch {
    // never crash the bot because of audit
  }
}

module.exports = { audit };
