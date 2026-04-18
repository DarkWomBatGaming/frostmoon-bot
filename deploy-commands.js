/**
 * One-time (or whenever you change commands) deploy script.
 *
 * Requirements:
 * - discord.js v14
 * - .env contains:
 *    TOKEN=your_bot_token
 *    CLIENT_ID=your_application_client_id
 *
 * Run:
 *   node deploy-commands.js
 *
 * Notes:
 * - This deploys GUILD commands (fast update) to config.GUILD_ID.
 * - If you want global commands later, I can give you the global version.
 */

require("dotenv").config();
const { REST, Routes } = require("discord.js");
const config = require("./config");

if (!process.env.TOKEN) {
  console.error("❌ Missing TOKEN in .env");
  process.exit(1);
}

if (!process.env.CLIENT_ID) {
  console.error("❌ Missing CLIENT_ID in .env (your Discord Application ID)");
  process.exit(1);
}

if (!config.GUILD_ID) {
  console.error("❌ Missing GUILD_ID in config.js");
  process.exit(1);
}

// Keep these in sync with your commands/*.js definitions
const commands = [
  {
  name: "verifiedusers",
  description: "List verified users from used_igns.json (admin)."
},
{
  name: "refreshroster",
  description: "Force refresh the roster message (admin)."
},
{
  name: "listnames",
  description: "List verified IGNs (names) from used_igns.json (admin)."
},
  {
    name: "setcount",
    description: "Override the roster count (admin).",
    options: [
      {
        name: "count",
        description: "Roster count number (e.g. 10)",
        type: 4, // INTEGER
        required: true,
        min_value: 0,
        max_value: 9999
      }
    ]
  },
  {
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
    ]
  },
  {
    name: "addign",
    description: "Add an allowed IGN (admin).",
    options: [
      {
        name: "ign",
        description: "IGN to add",
        type: 3, // STRING
        required: true
      }
    ]
  },
  {
    name: "removeign",
    description: "Remove an allowed IGN (admin).",
    options: [
      {
        name: "ign",
        description: "IGN to remove",
        type: 3, // STRING
        required: true
      }
    ]
  }
];

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log(`🚀 Deploying ${commands.length} guild command(s) to guild ${config.GUILD_ID}...`);

    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, config.GUILD_ID),
      { body: commands }
    );

    console.log("✅ Successfully deployed guild commands.");
    console.log("Commands:", commands.map(c => `/${c.name}`).join(", "));
  } catch (error) {
    console.error("❌ Failed to deploy commands:", error);
    process.exit(1);
  }
})();
