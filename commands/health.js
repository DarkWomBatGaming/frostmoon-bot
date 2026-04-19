const os = require("os");
const fs = require("fs");

module.exports = {
  name: "health",
  description: "Show bot health info (admin).",

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const uptimeSec = Math.floor(process.uptime());
    const mem = process.memoryUsage();
    const rssMb = Math.round(mem.rss / 1024 / 1024);
    const heapMb = Math.round(mem.heapUsed / 1024 / 1024);

    const ping = interaction.client.ws.ping;

    const fileSize = (p) => {
      try { return fs.statSync(p).size; } catch { return 0; }
    };

    const usedSize = fileSize("./data/used_igns.json");
    const ignsSize = fileSize("./data/igns.json");

    return interaction.editReply(
      `✅ **Health Check**\n` +
      `• Uptime: **${uptimeSec}s**\n` +
      `• WS Ping: **${ping}ms**\n` +
      `• Memory: RSS **${rssMb}MB**, Heap **${heapMb}MB**\n` +
      `• Host: **${os.platform()} ${os.arch()}**\n` +
      `• Data sizes: used_igns.json **${usedSize} bytes**, igns.json **${ignsSize} bytes**`
    );
  }
};
