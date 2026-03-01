import express from "express";
import { Client, GatewayIntentBits } from "discord.js";
import axios from "axios";
import * as cheerio from "cheerio";
import cron from "node-cron";
import fs from "fs";

const BLOGS = [
  {
    url: "https://lala.fanpla.jp/blog/list/1426/0/",
    message: "📢 **STAFFの業務日報更新！**"
  },
  {
    url: "https://lala.fanpla.jp/blog/list/1427/0/",
    message: "📢 **あやほのひとりごと報告書更新！**"
  },
  {
    url: "https://lala.fanpla.jp/blog/list/1428/0/",
    message: "📢 **ヲタクの定期連絡更新！**"
  },
  {
    url: "https://lala.fanpla.jp/blog/list/1429/0/",
    message: "📢 **ゆめかのあのねノート更新！**"
  }
];

const FILE = "./last.json";
const PORT = process.env.PORT || 10000;

// ---------- Express ----------
const app = express();
app.get("/", (_, res) => res.send("Bot稼働中"));
app.listen(PORT, () => console.log(`🌐 Server running on port ${PORT}`));

// ---------- Discord ----------
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("clientReady", () => {
  console.log("✅ Bot起動完了");
});

// ---------- 最新1件取得 ----------
function getLatestBlog(html) {
  const $ = cheerio.load(html);

  const first = $("li.list__item").first();

  if (!first.length) {
    console.log("list__item が見つかりません");
    return null;
  }

  const title = first.find(".tit").text().trim();
  const linkPath = first.find("a").attr("href");

  if (!title || !linkPath) {
    console.log("title または link が取得できません");
    return null;
  }

  const link = "https://lala.fanpla.jp" + linkPath;

  return `${title}\n${link}`;
}
// ---------- 通知 ----------
async function sendDiscord(title, content) {
  try {
    const channel = await client.channels.fetch(process.env.CHANNEL_ID);
    await channel.send(`${title}\n\n${content}`);
    console.log("通知送信:", title);
  } catch (err) {
    console.error("Discord通知エラー:", err.message);
  }
}

// ---------- チェック ----------
async function checkWebsite() {
  console.log("🔍 ブログ更新チェック開始");

  // ★ デバッグ①
  console.log("BLOGS件数:", BLOGS.length);

  const isFirstRun = !fs.existsSync(FILE);
  let oldData = {};

  if (!isFirstRun) {
    oldData = JSON.parse(fs.readFileSync(FILE, "utf-8"));
  }

  let newData = {};

  // ★ デバッグ②
  console.log("ループ開始");

  for (const blog of BLOGS) {
    console.log("取得開始:", blog.url); // ★ デバッグ③

    try {
      const res = await axios.get(blog.url, {
        timeout: 10000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "ja-JP,ja;q=0.9"
        }
      });

      console.log("取得成功:", blog.url); // ★ デバッグ④

      const latest = getLatestBlog(res.data);

      if (!latest) {
        console.log("記事抽出失敗:", blog.url);
        continue;
      }

      newData[blog.url] = latest;

      if (isFirstRun) {
        console.log("初回起動のため通知しません");
        continue;
      }

      if (oldData[blog.url] !== latest) {
        console.log("新規検出:", blog.url);
        await sendDiscord(blog.message, latest);
      } else {
        console.log("新規なし:", blog.url);
      }

    } catch (err) {
      console.error("取得失敗:", blog.url, err.message);
    }
  }

  fs.writeFileSync(FILE, JSON.stringify(newData, null, 2));

  console.log("🔍 ブログ更新チェック終了");
}

// ---------- cron ----------
cron.schedule("*/5 * * * *", async () => {
  console.log("🕒 cron発火", new Date().toLocaleString());

  try {
    await Promise.race([
      checkWebsite(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("check timeout")), 20000)
      )
    ]);
  } catch (err) {
    console.error("cron強制終了:", err.message);
  }
});

client.login(process.env.DISCORD_TOKEN);
