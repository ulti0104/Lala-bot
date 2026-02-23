import express from "express";
import { Client, GatewayIntentBits } from "discord.js";
import axios from "axios";
import * as cheerio from "cheerio";
import cron from "node-cron";
import fs from "fs";

const TARGET_URL = "https://lala.fanpla.jp/blog/listall/";
const FILE = "./last.txt";
const PORT = process.env.PORT || 10000;

// ---------- Expressサーバー ----------
const app = express();
app.get("/", (_, res) => res.send("Bot稼働中"));
app.listen(PORT, () => console.log(`🌐 Server running on port ${PORT}`));

// ---------- Discord Bot ----------
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("clientReady", () => {
  console.log("✅ Bot起動完了");
});

// ---------- 差分抽出 ----------
function getDiff(oldText, newText) {
  if (!oldText) return null;

  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");

  const added = newLines.filter(
    (line) => !oldLines.includes(line) && line.trim() !== ""
  );

  return added.slice(0, 10);
}

// ---------- HTMLからブログ抽出 ----------
function extractBlogText(html) {
  const $ = cheerio.load(html);
  const blogs = [];

  $(".block--bloglist .list__item").each((i, el) => {
    const title = $(el).find(".block--txt .tit").text().trim();
    const link =
      "https://lala.fanpla.jp" + $(el).find("a").attr("href");

    if (title && link) {
      blogs.push(`${title}\n${link}`);
    }
  });

  return blogs.join("\n");
}

// ---------- Discord通知 ----------
async function sendDiscord(diff) {
  if (!diff || diff.length === 0) return;

  try {
    const channel = await client.channels.fetch(
      process.env.CHANNEL_ID
    );

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

// ---------- ブログチェック ----------
async function checkWebsite() {
  console.log("🔍 ブログ更新チェック開始");

  try {
    const res = await axios.get(TARGET_URL, {
      timeout: 10000, // axios側タイムアウト
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
          "AppleWebKit/537.36 (KHTML, like Gecko) " +
          "Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "ja-JP,ja;q=0.9",
      },
    });

    if (!res.data || res.data.trim() === "") {
      throw new Error("HTMLが空です");
    }

    const text = extractBlogText(res.data);

    if (!text || text.trim() === "") {
      throw new Error("ブログ抽出結果が空");
    }

    let oldText = "";
    if (fs.existsSync(FILE)) {
      oldText = fs.readFileSync(FILE, "utf-8");
    }

    const diff = getDiff(oldText, text);

    if (diff && diff.length > 0 && oldText) {
      await sendDiscord(diff);
    } else {
      console.log("新規ブログなし");
    }

    fs.writeFileSync(FILE, text);

  } catch (err) {
    console.error("ブログ取得失敗:", err.message);
    if (err.response) {
      console.error("HTTPステータス:", err.response.status);
    }
  }

  console.log("🔍 ブログ更新チェック終了");
}

// ---------- 5分ごとに実行（強制終了ガード付き） ----------
cron.schedule("*/5 * * * *", async () => {
  console.log("🕒 cron発火", new Date().toLocaleString());

  try {
    await Promise.race([
      checkWebsite(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("checkWebsite timeout")), 15000)
      ),
    ]);
  } catch (err) {
    console.error("cron強制終了:", err.message);
  }
});

// ---------- Discordログイン ----------
client.login(process.env.DISCORD_TOKEN);
