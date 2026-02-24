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

// ---------- 差分 ----------
function getDiff(oldArr = [], newArr = []) {
  return newArr.filter(x => !oldArr.includes(x));
}

// ---------- HTML抽出 ----------
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

  return blogs;
}

// ---------- 通知 ----------
async function sendDiscord(title, diff) {
  if (!diff.length) return;

  try {
    const channel = await client.channels.fetch(process.env.CHANNEL_ID);

    await channel.send(
      `${title}\n\n` +
      diff.join("\n\n")
    );

    console.log("通知送信:", title);
  } catch (err) {
    console.error("Discord通知エラー:", err.message);
  }
}

// ---------- チェック ----------
async function checkWebsite() {
  console.log("🔍 ブログ更新チェック開始");

  const isFirstRun = !fs.existsSync(FILE);

  let oldData = {};
  if (!isFirstRun) {
    oldData = JSON.parse(fs.readFileSync(FILE, "utf-8"));
  }

  let newData = {};

  for (const blog of BLOGS) {
    try {
      console.log("取得:", blog.url);

      const res = await axios.get(blog.url, {
        timeout: 10000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
            "AppleWebKit/537.36 (KHTML, like Gecko) " +
            "Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "ja-JP,ja;q=0.9"
        }
      });

      const blogs = extractBlogText(res.data);
      newData[blog.url] = blogs;

      if (isFirstRun) {
        console.log("初回起動のため通知しません");
        continue;
      }

      const diff = getDiff(oldData[blog.url], blogs);

      if (diff.length > 0 && oldData[blog.url]) {
        console.log("新規あり:", blog.url);
        await sendDiscord(blog.message, diff.slice(0, 5));
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

// ---------- cron（強制終了ガード） ----------
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

// ---------- ログイン ----------
client.login(process.env.DISCORD_TOKEN);
