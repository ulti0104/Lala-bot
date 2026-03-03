みみ
ulti.14
オンライン状態を隠す

みみ — 2026/03/01 17:39
import express from "express";
import { Client, GatewayIntentBits } from "discord.js";
import axios from "axios";
import * as cheerio from "cheerio";
import cron from "node-cron";
import fs from "fs";

テキスト.txt
4 KB
みみ — 2026/03/01 18:04
🕒 cron発火 3/1/2026, 9:00:00 AM
🔍 ブログ更新チェック開始
BLOGS件数: 4
ループ開始
取得開始: https://lala.fanpla.jp/blog/list/1426/0/
取得成功: https://lala.fanpla.jp/blog/list/1426/0/
記事抽出失敗: https://lala.fanpla.jp/blog/list/1426/0/
取得開始: https://lala.fanpla.jp/blog/list/1427/0/
取得成功: https://lala.fanpla.jp/blog/list/1427/0/
記事抽出失敗: https://lala.fanpla.jp/blog/list/1427/0/
取得開始: https://lala.fanpla.jp/blog/list/1428/0/
取得成功: https://lala.fanpla.jp/blog/list/1428/0/
記事抽出失敗: https://lala.fanpla.jp/blog/list/1428/0/
取得開始: https://lala.fanpla.jp/blog/list/1429/0/
取得成功: https://lala.fanpla.jp/blog/list/1429/0/
記事抽出失敗: https://lala.fanpla.jp/blog/list/1429/0/
🔍 ブログ更新チェック終了
Lala｜ララカンパニー
Lala｜ララカンパニー
ララカンパニー。Lalaの最新情報を掲載！
Lala｜ララカンパニー
Lala｜ララカンパニー
Lala｜ララカンパニー
ララカンパニー。Lalaの最新情報を掲載！
Lala｜ララカンパニー
Lala｜ララカンパニー
Lala｜ララカンパニー
ララカンパニー。Lalaの最新情報を掲載！
Lala｜ララカンパニー
Lala｜ララカンパニー
Lala｜ララカンパニー
ララカンパニー。Lalaの最新情報を掲載！
Lala｜ララカンパニー
function getLatestBlog(html) {
  const $ = cheerio.load(html);

  const first = $("li.list__item").first();

  if (!first.length) {

テキスト.txt
1 KB
みみ — 2026/03/01 22:22
🕒 cron発火 3/1/2026, 1:20:00 PM
🔍 ブログ更新チェック開始
BLOGS件数: 4
ループ開始
取得開始: https://lala.fanpla.jp/blog/list/1426/0/
取得成功: https://lala.fanpla.jp/blog/list/1426/0/
新規検出: https://lala.fanpla.jp/blog/list/1426/0/
cron強制終了: check timeout
Lala｜ララカンパニー
Lala｜ララカンパニー
ララカンパニー。Lalaの最新情報を掲載！
Lala｜ララカンパニー
async function sendDiscord(title, content) {
  try {
    console.log("Discord送信開始");

    const channel = await Promise.race([
      client.channels.fetch(process.env.CHANNEL_ID),

テキスト.txt
1 KB
みみ — 2026/03/01 22:59
import express from "express";
import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,

テキスト.txt
5 KB
みみ — 2026/03/01 23:47
==> Deploying...
==> Setting WEB_CONCURRENCY=1 by default, based on available CPUs in the instance
==> Running 'node index.js'
🌐 Server running on port 10000
==> Your service is live 🎉
==> 
==> ///////////////////////////////////////////////////////////
==> 
==> Available at your primary URL https://lala-bot-74iu.onrender.com/
==> 
==> ///////////////////////////////////////////////////////////
console.log("TOKEN確認:", process.env.DISCORD_TOKEN ? "OK" : "未設定");

client.login(process.env.DISCORD_TOKEN)
  .then(() => console.log("ログイン成功"))
  .catch(err => console.error("ログイン失敗:", err.message));
みみ — 2026/03/01 23:59
import express from "express";
import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,

新規 テキスト ドキュメント (2).txt
5 KB
みみ — 昨日 0:22
Node.js v18.20.8
==> Exited with status 1
==> Common ways to troubleshoot your deploy: https://render.com/docs/troubleshooting-deploys
==> Running 'node index.js'
/opt/render/project/src/node_modules/undici/lib/web/webidl/index.js:534
webidl.is.File = webidl.util.MakeTypeAssertion(File)
                                               ^
ReferenceError: File is not defined
    at Object.<anonymous> (/opt/render/project/src/node_modules/undici/lib/web/webidl/index.js:534:48)
    at Module._compile (node:internal/modules/cjs/loader:1364:14)
    at Module._extensions..js (node:internal/modules/cjs/loader:1422:10)
    at Module.load (node:internal/modules/cjs/loader:1203:32)
    at Module._load (node:internal/modules/cjs/loader:1019:12)
    at Module.require (node:internal/modules/cjs/loader:1231:19)
    at require (node:internal/modules/helpers:177:18)
    at Object.<anonymous> (/opt/render/project/src/node_modules/undici/lib/web/fetch/util.js:12:20)
    at Module._compile (node:internal/modules/cjs/loader:1364:14)
    at Module._extensions..js (node:internal/modules/cjs/loader:1422:10)
Render
Troubleshooting Your Deploy
Diagnose and resolve common issues when deploying to Render.
Troubleshooting Your Deploy
みみ — 17:11
🕒 cron発火 3/3/2026, 8:10:00 AM
🔍 ブログ更新チェック開始
新規検出: https://lala.fanpla.jp/blog/list/1426/0/
Discord送信開始
cron強制終了: check timeout
Lala｜ララカンパニー
Lala｜ララカンパニー
ララカンパニー。Lalaの最新情報を掲載！
Lala｜ララカンパニー
みみ — 17:22
import express from "express";
import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,

テキスト.txt
6 KB
みみ — 17:33
https://discord.com/oauth2/authorize?client_id=1474876615753466087
Lala-bot

詳しくはこちら
みみ — 17:44
import dns from "dns";

dns.lookup("discord.com", (err) => {
  if (err) {
    console.error("DNSエラー:", err);
  } else {
    console.log("Discord DNS OK");
  }
});
みみ — 18:02
https://discord.com/oauth2/authorize?client_id=1474876615753466087&permissions=8&integration_type=0&scope=bot+applications.commands
みみ — 19:12
https://discord.com/oauth2/authorize?client_id=1478333662104649808&permissions=8&integration_type=0&scope=bot+applications.commands
==> Detected service running on port 10000
==> Docs on specifying a port: https://render.com/docs/web-services#port-binding
==> Deploying...
==> Setting WEB_CONCURRENCY=1 by default, based on available CPUs in the instance
==> Running 'node index.js'
Node version: v20.20.0
TOKEN確認: OK
🌐 Server running on port 10000
Discord DNS OK
==> Your service is live 🎉
==> 
==> ///////////////////////////////////////////////////////////
==> 
==> Available at your primary URL https://lala-bot-74iu.onrender.com/
==> 
==> ///////////////////////////////////////////////////////////
Render
Web Services
Deploy Web Services on Render in just a few clicks.
Web Services
みみ — 19:21
{
  "name": "lala-bot",
  "version": "1.0.0",
  "type": "module",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "cheerio": "^1.0.0",
    "discord.js": "^14.0.0",
    "node-cron": "^3.0.0",
    "express": "^4.18.0"
  }
}
import dns from "dns";

dns.lookup("discord.com", (err) => {
  if (err) {
    console.error("DNSエラー:", err);
  } else {

新規 テキスト ドキュメント (2).txt
6 KB
import dns from "dns";

dns.lookup("discord.com", (err) => {
  if (err) {
    console.error("DNSエラー:", err);
  } else {

テキスト.txt
5 KB
﻿
み
ulti.14.sub
 
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
テキスト.txt
5 KB
