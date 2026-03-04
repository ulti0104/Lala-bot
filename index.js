import express from "express";
import { Client, GatewayIntentBits } from "discord.js";
import axios from "axios";
import * as cheerio from "cheerio";
import cron from "node-cron";
import fs from "fs";

/* =========================
   Web Service維持用
========================= */

const app = express();
const PORT = process.env.PORT || 10000;

app.get("/", (req, res) => {
  res.send("Bot running");
});

app.listen(PORT, () => {
  console.log("🌐 Web server started");
});

/* =========================
   Discord
========================= */

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once("ready", () => {
  console.log(`✅ Bot Online: ${client.user.tag}`);
});

/* =========================
   通知設定
========================= */

const BLOG_URL = "https://lala.fanpla.jp/blog/list/1426/0/";
const FILE = "./last.json";

/* =========================
   通知処理
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
   ブログ取得
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
  console.log("🔍 更新チェック");

  const isFirst = !fs.existsSync(FILE);
  let old = null;

  if (!isFirst) {
    old = fs.readFileSync(FILE, "utf-8");
  }

  try {
    const res = await axios.get(BLOG_URL);
    const latest = getLatest(res.data);
    if (!latest) return;

    if (!isFirst && old !== latest) {
      await sendDiscord(`📢 ブログ更新！\n\n${latest}`);
    }

    fs.writeFileSync(FILE, latest);

  } catch (err) {
    console.error("取得失敗:", err.message);
  }
}

/* =========================
   5分ごと
========================= */

cron.schedule("*/5 * * * *", () => {
  checkUpdate();
});

/* =========================
   起動
========================= */

console.log("Node:", process.version);
console.log("TOKEN:", process.env.DISCORD_TOKEN ? "OK" : "NG");

client.login(process.env.DISCORD_TOKEN);
