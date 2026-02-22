import { Client, GatewayIntentBits } from "discord.js";
import axios from "axios";
import * as cheerio from "cheerio";
import cron from "node-cron";
import fs from "fs";
import express from "express";

const TARGET_URL = "https://lala.fanpla.jp/blog/listall/";
const FILE = "./last.txt";
const PORT = process.env.PORT || 3000;

// --- Discord Bot 初期化 ---
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("clientReady", () => { // v15以降は clientReady
  console.log("Bot起動完了");
});

// --- 差分抽出 ---
function getDiff(oldText, newText) {
  if (!oldText) return null;

  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");

  const added = newLines.filter(line =>
    !oldLines.includes(line) && line.trim() !== ""
  );

  return added.slice(0, 10); // 最大10件
}

// --- HTMLからブログタイトルとリンクを抽出 ---
function extractBlogText(html) {
  const $ = cheerio.load(html);
  const blogs = [];

  $(".block--bloglist .list__item").each((i, el) => {
    const title = $(el).find(".block--txt .tit").text().trim();
    const href = $(el).find("a").attr("href");
    if (title && href) blogs.push(`${title}\nhttps://lala.fanpla.jp${href}`);
  });

  return blogs.join("\n");
}

// --- Discord通知 ---
async function sendDiscord(diff) {
  if (!diff || diff.length === 0) return;

  try {
    const channel = await client.channels.fetch(process.env.CHANNEL_ID);
    await channel.send(
      "📢 **Lala BLOG更新！**\n\n" +
      diff.join("\n\n") +
      "\n\n🔗 https://lala.fanpla.jp/blog/listall/"
    );
    console.log(`${diff.length} 件の新規ブログを通知しました`);
  } catch (err) {
    console.error("Discord通知エラー:", err.message);
  }
}

// --- ブログチェック ---
async function checkWebsite() {
  console.log("🔍 ブログ更新チェック");

  let text = "";
  try {
    const res = await axios.get(TARGET_URL, { timeout: 10000 }); // タイムアウト10秒
    text = extractBlogText(res.data);
  } catch (err) {
    console.error("ブログ取得失敗:", err.message);
    return; // 失敗時は差分チェックせず終了
  }

  let oldText = fs.existsSync(FILE) ? fs.readFileSync(FILE, "utf-8") : "";
  const diff = getDiff(oldText, text);

  if (diff && diff.length > 0 && oldText) {
    await sendDiscord(diff);
  } else {
    console.log("新規ブログなし");
  }

  fs.writeFileSync(FILE, text);
}

// --- 定期実行（5分ごと） ---
cron.schedule("*/5 * * * *", async () => {
  await checkWebsite();
});

// --- Discord Bot ログイン ---
client.login(process.env.DISCORD_TOKEN);

// --- Expressで簡易サーバーを起動（Render用ポート確保） ---
const app = express();
app.get("/", (req, res) => res.send("Bot is running"));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
