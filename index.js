require("dotenv").config();
const express = require("express");
const fs = require("fs");
const { Client, GatewayIntentBits } = require("discord.js");

const app = express();
app.get("/", (req, res) => res.send("Frostmoon Alive"));
app.listen(process.env.PORT || 3000);

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

/* LOAD EVENTS */
const eventFiles = fs.readdirSync("./events");

for (const file of eventFiles) {
  const event = require(`./events/${file}`);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

if (!process.env.TOKEN) {
  console.error("❌ ERROR: TOKEN environment variable is not set. Exiting.");
  process.exit(1);
}

client.login(process.env.TOKEN);
