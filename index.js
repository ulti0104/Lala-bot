import { Client, GatewayIntentBits } from "discord.js";
import axios from "axios";
import * as cheerio from "cheerio"; // cheerio ESM対応
import cron from "node-cron";
import fs from "fs";

const TARGET_URL = "https://lala.fanpla.jp/blog/listall/";
const FILE = "./last.txt";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Discord Bot 起動
client.once("ready", () => {
  console.log("Bot起動完了");
});

// 差分抽出
function getDiff(oldText, newText) {
  if (!oldText) return null;

  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");

  const added = newLines.filter(line =>
    !oldLines.includes(line) && line.trim() !== ""
  );

  return added.slice(0, 10);
}

// HTMLからブログタイトルとリンクを抽出
function extractBlogText(html) {
  const $ = cheerio.load(html);
  const blogs = [];

  $(".block--bloglist .list__item").each((i, el) => {
    const title = $(el).find(".block--txt .tit").text().trim();
    const link = "https://lala.fanpla.jp" + $(el).find("a").attr("href");
    blogs.push(`${title}\n${link}`);
  });

  return blogs.join("\n");
}

// Discord通知
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

// ブログチェック
async function checkWebsite() {
  console.log("🔍 ブログ更新チェック");

  try {
    const res = await axios.get(TARGET_URL);
    const text = extractBlogText(res.data);

    let oldText = "";
    if (fs.existsSync(FILE)) oldText = fs.readFileSync(FILE, "utf-8");

    const diff = getDiff(oldText, text);

    if (diff && diff.length > 0 && oldText) {
      await sendDiscord(diff);
    } else {
      console.log("新規ブログなし");
    }

    fs.writeFileSync(FILE, text);

  } catch (err) {
    console.error("ブログ取得失敗:", err.message);
  }
}

// 5分ごとに実行
cron.schedule("*/5 * * * *", async () => {
  await checkWebsite();
});

client.login(process.env.DISCORD_TOKEN);
