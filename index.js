import dns from "dns";

dns.lookup("discord.com", (err) => {
  if (err) {
    console.error("DNSエラー:", err);
  } else {
    console.log("Discord DNS OK");
  }
});

import express from "express";
import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder
} from "discord.js";
import axios from "axios";
import * as cheerio from "cheerio";
import cron from "node-cron";
import fs from "fs";

/* =========================
   設定
========================= */

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

/* =========================
   Express
========================= */

const app = express();
app.get("/", (_, res) => res.send("Bot稼働中"));
app.listen(PORT, () =>
  console.log(`🌐 Server running on port ${PORT}`)
);

/* =========================
   Discord
========================= */

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

/* 🔥 重要：readyはこれ */
client.once("ready", async () => {
  console.log("🔥 READY発火（Botオンライン）");

  // スラッシュコマンド登録
  const commands = [
    new SlashCommandBuilder()
      .setName("test")
      .setDescription("通知テストを送信します")
  ].map(cmd => cmd.toJSON());

  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

  try {
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log("✅ /test コマンド登録完了");
  } catch (err) {
    console.error("コマンド登録エラー:", err.message);
  }
});

/* エラー強制表示 */
client.on("error", err => {
  console.error("Clientエラー:", err);
});

client.on("shardError", err => {
  console.error("Shardエラー:", err);
});

client.on("debug", msg => {
  console.log("DEBUG:", msg);
});

/* =========================
   通知処理
========================= */

async function sendDiscord(title, content) {
  try {
    const channel = await client.channels.fetch(process.env.CHANNEL_ID);
    await channel.send(`${title}\n\n${content}`);
    console.log("✅ 通知送信成功:", title);
  } catch (err) {
    console.error("❌ Discord通知エラー:", err.message);
  }
}

/* =========================
   ブログ解析
========================= */

function getLatestBlog(html) {
  const $ = cheerio.load(html);
  const first = $("li.list__item").first();

  const title = first.find(".tit").text().trim();
  const linkPath = first.find("a").attr("href");

  if (!title || !linkPath) return null;

  return `${title}\nhttps://lala.fanpla.jp${linkPath}`;
}

/* =========================
   更新チェック
========================= */

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
      const res = await axios.get(blog.url, { timeout: 15000 });
      const latest = getLatestBlog(res.data);
      if (!latest) continue;

      newData[blog.url] = latest;

      if (!isFirstRun && oldData[blog.url] !== latest) {
        console.log("🆕 新規検出:", blog.url);
        await sendDiscord(blog.message, latest);
      }

    } catch (err) {
      console.error("取得失敗:", blog.url, err.message);
    }
  }

  fs.writeFileSync(FILE, JSON.stringify(newData, null, 2));
  console.log("🔍 ブログ更新チェック終了");
}

/* =========================
   cron
========================= */

cron.schedule("*/5 * * * *", async () => {
  console.log("🕒 cron発火", new Date().toLocaleString());
  await checkWebsite();
});

/* =========================
   起動
========================= */

console.log("Node version:", process.version);
console.log("TOKEN確認:", process.env.DISCORD_TOKEN ? "OK" : "未設定");

client.login(process.env.DISCORD_TOKEN);
