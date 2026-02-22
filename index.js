import { Client, GatewayIntentBits } from "discord.js";
import axios from "axios";
import * as cheerio from "cheerio";
import cron from "node-cron";
import fs from "fs";
import express from "express";

const TARGET_URL = "https://lala.fanpla.jp";
const FILE = "./last.txt";

// ===== Discord Client =====
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// 起動ログ
client.once("clientReady", () => {
  console.log("✅ Bot起動完了");
});

// エラー監視（超重要）
client.on("error", console.error);

process.on("unhandledRejection", error => {
  console.error("未処理エラー:", error);
});

process.on("uncaughtException", error => {
  console.error("致命的エラー:", error);
});

// ===== 差分抽出 =====
function getDiff(oldText, newText) {
  if (!oldText) return null;

  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");

  const added = newLines.filter(line =>
    !oldLines.includes(line) && line.trim() !== ""
  );

  return added.slice(0, 10);
}

// ===== サイトチェック =====
async function checkWebsite() {
  try {
    console.log("🔍 更新チェック開始");

    const res = await axios.get(TARGET_URL, {
      timeout: 15000
    });

    const $ = cheerio.load(res.data);

    const text = $("body")
      .text()
      .replace(/\s+/g, "\n")
      .trim();

    let oldText = "";
    if (fs.existsSync(FILE)) {
      oldText = fs.readFileSync(FILE, "utf-8");
    }

    const diff = getDiff(oldText, text);

    if (diff && diff.length > 0 && oldText) {
      const channel = await client.channels.fetch(process.env.CHANNEL_ID);

      if (channel) {
        await channel.send(
          "📢 **Lalaサイト更新！**\n\n" +
          diff.join("\n") +
          "\n\n🔗 https://lala.fanpla.jp"
        );
        console.log("📨 更新通知送信完了");
      }
    }

    fs.writeFileSync(FILE, text);

    console.log("✅ チェック完了");

  } catch (err) {
    console.error("❌ チェックエラー:", err.message);
  }
}

// 5分ごとに実行
cron.schedule("*/5 * * * *", checkWebsite);

// ===== Discordログイン =====
client.login(process.env.DISCORD_TOKEN);

// ===== Render用ダミーWebサーバー =====
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Bot is running");
});

app.listen(PORT, () => {
  console.log(`🌐 Server running on port ${PORT}`);
});
