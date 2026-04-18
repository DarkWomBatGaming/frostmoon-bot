const fs = require("fs");
const config = require("../config");
const { updateRoster } = require("../services/rosterService");

const OVERRIDE_FILE = "./data/roster_override.json";

function ensureDataDir() {
  if (!fs.existsSync("./data")) fs.mkdirSync("./data", { recursive: true });
}

function readOverride() {
  try {
    if (!fs.existsSync(OVERRIDE_FILE)) return null;
    const data = JSON.parse(fs.readFileSync(OVERRIDE_FILE, "utf8"));
    const n = Number(data?.count);
    if (!Number.isFinite(n)) return null;
    return n;
  } catch {
    return null;
  }
}

function writeOverride(count) {
  ensureDataDir();
  fs.writeFileSync(OVERRIDE_FILE, JSON.stringify({ count }, null, 2));
}

module.exports = {
  name: "kickteam",
  description: "Kick a user out of the team (remove Khanrian, add Wanderer, decrement roster override).",
  options: [
    {
      name: "user",
      description: "User to remove from the team",
      type: 6, // USER
      required: true
    },
    {
      name: "reason",
      description: "Optional reason",
      type: 3, // STRING
      required: false
    }
  ],

  async execute(interaction) {
    if (!interaction.member.permissions.has("Administrator")) {
      return interaction.reply({ content: "❌ Admin only", ephemeral: true });
    }

    const user = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason") || "No reason provided";

    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) {
      return interaction.reply({ content: "❌ Could not find that member in the guild.", ephemeral: true });
    }

    const hadKhanrian = member.roles.cache.has(config.ROLE_KHANRIAN);

    // Role changes (this will trigger your guildMemberUpdate announcement)
    await member.roles.remove(config.ROLE_KHANRIAN).catch(() => {});
    await member.roles.add(config.ROLE_WANDERER).catch(() => {});

    // Decrement roster override count
    // If override doesn't exist, we create it based on current cache count (post-change)
    const currentOverride = readOverride();

    let newCount;
    if (currentOverride == null) {
      // Build a new override from cache count (safe-ish) so future changes are consistent
      const cacheCount = interaction.guild.members.cache.filter(m =>
        m.roles.cache.has(config.ROLE_KHANRIAN)
      ).size;
      newCount = Math.max(0, cacheCount);
    } else {
      // Only decrement if they actually had the team role
      newCount = hadKhanrian ? Math.max(0, currentOverride - 1) : currentOverride;
    }

    writeOverride(newCount);

    await updateRoster(interaction.guild);

    return interaction.reply({
      ephemeral: true,
      content:
        `✅ Updated **${member.user.tag}**:\n` +
        `• Khanrian removed, Wanderer added\n` +
        `• Roster override now: **${newCount}**\n` +
        `• Reason: ${reason}`
    });
  }
};
