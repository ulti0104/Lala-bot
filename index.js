import express from "express";
import { Client, GatewayIntentBits } from "discord.js";
import axios from "axios";
import * as cheerio from "cheerio";
import cron from "node-cron";
import fs from "fs";

/* =========================
   Web Service維持
========================= */

const app = express();

app.get("/", (_, res) => res.send("OK"));

app.listen(process.env.PORT, () => {
  console.log("🌐 Web server started");
});

/* =========================
   Discord（自動再接続強化）
========================= */

let client;

function createClient() {
  client = new Client({
    intents: [GatewayIntentBits.Guilds],
  });

  client.once("clientReady", () => {
    console.log(`✅ Bot Online: ${client.user.tag}`);
  });

  client.on("disconnect", () => {
    console.log("⚠ 切断検知 → 再接続");
    reconnect();
  });

  client.on("error", (err) => {
    console.error("Clientエラー:", err);
  });

  client.on("shardError", (err) => {
    console.error("Shardエラー:", err);
  });

  client.login(process.env.DISCORD_TOKEN)
    .then(() => console.log("🔑 login成功"))
    .catch(err => {
      console.error("🔑 login失敗:", err);
      setTimeout(reconnect, 5000);
    });
}

function reconnect() {
  try {
    if (client) client.destroy();
  } catch {}
  console.log("🔄 再接続中...");
  setTimeout(createClient, 5000);
}

createClient();

/* =========================
   監視対象（4ブログ）
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

/* =========================
   通知
========================= */

async function sendDiscord(content) {
  try {
    const channel = await client.channels.fetch(process.env.CHANNEL_ID);
    await channel.send(content);
    console.log("📨 通知送信成功");
  } catch (err) {
    console.error("通知エラー:", err.message);
  }
}

/* =========================
   HTML解析
========================= */

function getLatest(html) {
  const $ = cheerio.load(html);
  const first = $("li.list__item").first();

  const title = first.find(".tit").text().trim();
  const link = first.find("a").attr("href");

  if (!title || !link) return null;

  return `${title}\nhttps://lala.fanpla.jp${link}`;
}

/* =========================
   更新チェック
========================= */

async function checkUpdate() {
  console.log("🔍 更新チェック開始");

  const isFirst = !fs.existsSync(FILE);
  let oldData = {};

  if (!isFirst) {
    oldData = JSON.parse(fs.readFileSync(FILE, "utf-8"));
  }

  let newData = {};

  for (const blog of BLOGS) {
    try {
      const res = await axios.get(blog.url, { timeout: 15000 });
      const latest = getLatest(res.data);
      if (!latest) continue;

      newData[blog.url] = latest;

      if (!isFirst && oldData[blog.url] !== latest) {
        console.log("🆕 新規検出:", blog.url);
        await sendDiscord(`${blog.message}\n\n${latest}`);
      }

    } catch (err) {
      console.error("取得失敗:", blog.url, err.message);
    }
  }

  fs.writeFileSync(FILE, JSON.stringify(newData, null, 2));
  console.log("🔍 更新チェック終了");
}

/* =========================
   5分ごと実行
========================= */

cron.schedule("*/5 * * * *", async () => {
  await checkUpdate();
});

/* =========================
   異常終了監視
========================= */

process.on("unhandledRejection", err => {
  console.error("未処理Promise:", err);
});

process.on("uncaughtException", err => {
  console.error("未処理例外:", err);
  reconnect();
});

console.log("Node:", process.version);
console.log("TOKEN:", process.env.DISCORD_TOKEN ? "OK" : "NG");
