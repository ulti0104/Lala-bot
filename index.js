import express from "express";
import { Client, GatewayIntentBits } from "discord.js";

/* Express */
const app = express();
app.get("/", (_, res) => res.send("Bot稼働中"));
app.listen(process.env.PORT || 10000, () =>
  console.log("🌐 Server running")
);

/* Discord */
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.on("ready", () => {
  console.log("🔥 READY発火");
  console.log("Bot名:", client.user.tag);
});

client.on("error", err => {
  console.error("Clientエラー:", err);
});

client.on("debug", msg => {
  console.log("DEBUG:", msg);
});

console.log("Node:", process.version);
console.log("Token存在:", !!process.env.DISCORD_TOKEN);

client.login(process.env.DISCORD_TOKEN)
  .then(() => console.log("ログイン成功Promise"))
  .catch(err => console.error("ログイン失敗:", err));
