require("dotenv").config();
const express = require("express");
const fs = require("fs");
const { Client, GatewayIntentBits, Partials } = require("discord.js");

const app = express();
app.get("/", (req, res) => res.send("Frostmoon Alive"));
app.listen(process.env.PORT || 3000);

if (!process.env.TOKEN) {
  console.error("❌ Missing TOKEN in environment (.env). Set TOKEN=your_bot_token");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers // required for role checks on cached members
  ],
  partials: [Partials.GuildMember]
});

// Prevent crashes on discord.js emitted errors
client.on("error", (err) => {
  console.error("Discord client error:", err);
});

// Optional: log rate limits so you can see them without crashing
client.rest.on("rateLimited", (info) => {
  console.warn("REST rate limited:", info);
});

/* LOAD EVENTS */
const eventFiles = fs.readdirSync("./events").filter(f => f.endsWith(".js"));

for (const file of eventFiles) {
  const event = require(`./events/${file}`);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

client.login(process.env.TOKEN);
