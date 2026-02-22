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
    console.log("🔍 ブログ更新チェック");

    const res = await axios.get("https://lala.fanpla.jp/blog/listall/");
    const $ = cheerio.load(res.data);

    // 一番上の記事を取得
    const firstArticle = $(".blogList li").first();

    const title = firstArticle.find(".blogList_ttl").text().trim();
    const link = firstArticle.find("a").attr("href");
    const date = firstArticle.find(".blogList_date").text().trim();

    if (!title) {
      console.log("ブログ取得失敗");
      return;
    }

    let oldTitle = "";
    if (fs.existsSync(FILE)) {
      oldTitle = fs.readFileSync(FILE, "utf-8");
    }

    if (oldTitle && oldTitle !== title) {
      const channel = await client.channels.fetch(process.env.CHANNEL_ID);

      await channel.send(
        📝 **ブログ更新！**\n\n📅 ${date}\n📌 ${title}\n\n🔗 https://lala.fanpla.jp${link}
      );

      console.log("📨 ブログ通知送信");
    }

    fs.writeFileSync(FILE, title);

  } catch (err) {
    console.error("❌ ブログチェックエラー:", err.message);
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
