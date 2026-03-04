import express from "express";
import { Client, GatewayIntentBits } from "discord.js";

const app = express();

app.get("/", (_, res) => res.send("OK"));

app.listen(process.env.PORT, () => {
  console.log("🌐 Web server started");
});

console.log("Node:", process.version);
console.log("TOKEN:", process.env.DISCORD_TOKEN ? "OK" : "NG");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once("ready", () => {
  console.log("✅ READY発火");
});

client.login(process.env.DISCORD_TOKEN)
  .then(() => console.log("🔑 login成功"))
  .catch(err => console.error("🔑 login失敗:", err));
