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

app.listen(process.env.PORT || 10000, () => {
  console.log("🌐 Web server started");
});

/* =========================
   Discord（自動再接続強化）
========================= */

let client;
let reconnecting = false;

function createClient() {
  client = new Client({
    intents: [GatewayIntentBits.Guilds],
  });

  client.once("clientReady", () => {
    console.log(`✅ Bot Online: ${client.user.tag}`);
    reconnecting = false;
  });

  client.on("disconnect", () => {
    console.log("⚠ disconnect検知 → 再接続");
    reconnect();
  });

  client.on("shardDisconnect", (event, id) => {
    console.log(`⚠ shardDisconnect検知 shard=${id} code=${event.code}`);
    reconnect();
  });

  client.on("shardReconnecting", (id) => {
    console.log(`🔄 shard再接続中 shard=${id}`);
  });

  client.on("shardResume", (id, replayedEvents) => {
    console.log(`✅ shard復帰 shard=${id} replayed=${replayedEvents}`);
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
  if (reconnecting) {
    console.log("⏳ すでに再接続処理中");
    return;
  }

  reconnecting = true;

  try {
    if (client) client.destroy();
  } catch {}

  console.log("🔄 5秒後に再接続します...");
  setTimeout(() => {
    createClient();
  }, 5000);
}

createClient();

/* =========================
   監視対象（4ブログ + MOVIE）
========================= */

const TARGETS = [
  {
    key: "blog_staff",
    type: "blog",
    url: "https://lala.fanpla.jp/blog/list/1426/0/",
    message: "📢 **STAFFの業務日報更新！**"
  },
  {
    key: "blog_ayaho",
    type: "blog",
    url: "https://lala.fanpla.jp/blog/list/1427/0/",
    message: "📢 **あやほのひとりごと報告書更新！**"
  },
  {
    key: "blog_otaku",
    type: "blog",
    url: "https://lala.fanpla.jp/blog/list/1428/0/",
    message: "📢 **ヲタクの定期連絡更新！**"
  },
  {
    key: "blog_yumeka",
    type: "blog",
    url: "https://lala.fanpla.jp/blog/list/1429/0/",
    message: "📢 **ゆめかのあのねノート更新！**"
  },
  {
    key: "movie",
    type: "movie",
    url: "https://lala.fanpla.jp/movie/list/1",
    message: "🎬 **MOVIE更新！**"
  },
   {
     key: "photo",
     type: "photo",
     url: "https://lala.fanpla.jp/photo/list/3",
     message: "📷 PHOTO更新！"
   },
   {
     key: "radio",
     type: "radio",
     url: "https://lala.fanpla.jp/stream/list/2",
     message: "📻 RADIO更新！"
   }
];

const FILE = "./last.json";

/* =========================
   重複通知対策（メモリ）
========================= */

const recentSent = new Map();

function wasRecentlySent(key, latest) {
  const prev = recentSent.get(key);
  return prev === latest;
}

function markSent(key, latest) {
  recentSent.set(key, latest);
}

/* =========================
   ready待機
========================= */

async function waitForReady(timeoutMs = 30000) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    if (client && client.isReady()) return true;
    console.log("⏳ client ready待機中...");
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return false;
}

/* =========================
   通知
========================= */

async function sendDiscord(content, retry = true) {
  console.log("📨 sendDiscord 呼び出し");

  try {
    if (!client) {
      console.log("❌ clientが存在しない");
      return false;
    }

    if (!client.isReady()) {
      console.log("⚠ client未ready → 最大30秒待機");
      const ready = await waitForReady(30000);

      if (!ready) {
        console.log("❌ 30秒待ってもreadyにならない");

        if (retry) {
          console.log("🔁 10秒後に1回だけ再送");
          setTimeout(() => {
            sendDiscord(content, false);
          }, 10000);
        }
        return false;
      }

      console.log("✅ ready復帰確認");
    }

    console.log("CHANNEL_ID =", process.env.CHANNEL_ID);

    const channel = await client.channels.fetch(process.env.CHANNEL_ID);

    if (!channel) {
      console.log("❌ channel取得失敗（null）");
      return false;
    }

    console.log("取得チャンネル名:", channel.name);

    if (!channel.isTextBased()) {
      console.log("❌ テキストチャンネルではない");
      return false;
    }

    await channel.send(content);
    console.log("✅ 通知送信成功");
    return true;

  } catch (err) {
    console.error("❌ 通知エラー全文:", err);

    if (retry) {
      console.log("🔁 10秒後に1回だけ再送");
      setTimeout(() => {
        sendDiscord(content, false);
      }, 10000);
    }

    return false;
  }
}

/* =========================
   HTML解析（ブログ）
========================= */

function getLatestBlog(html) {
  const $ = cheerio.load(html);
  const first = $("li.list__item").first();

  const title = first.find(".tit").text().trim();
  const link = first.find("a").attr("href");

  if (!title || !link) return null;

  const fullUrl = link.startsWith("http")
    ? link
    : `https://lala.fanpla.jp${link}`;

  return `${title}\n${fullUrl}`;
}

/* =========================
   HTML解析（MOVIE）
========================= */

function getLatestMovie(html) {
  const $ = cheerio.load(html);
  const first = $("li.list__item").first();

  const title =
    first.find(".tit").text().trim() ||
    first.find(".title").text().trim() ||
    first.find("img").attr("alt")?.trim();

  const link = first.find("a").attr("href");

  if (!title || !link) return null;

  const fullUrl = link.startsWith("http")
    ? link
    : `https://lala.fanpla.jp${link}`;

  return `${title}\n${fullUrl}`;
}

/* =========================
   最新取得
========================= */

function parseLatest(target, html) {
  if (
    target.type === "movie" ||
    target.type === "photo" ||
    target.type === "radio"
  ) {
    return getLatestMovie(html);
  }

  return getLatestBlog(html);
}

/* =========================
   更新チェック
========================= */

let checking = false;

async function checkUpdate() {
  if (checking) {
    console.log("⏳ 前回のチェック実行中のためスキップ");
    return;
  }

  checking = true;
  console.log("🔍 更新チェック開始");

  try {
    const isFirst = !fs.existsSync(FILE);
    let oldData = {};

    if (!isFirst) {
      try {
        oldData = JSON.parse(fs.readFileSync(FILE, "utf-8"));
      } catch (err) {
        console.error("⚠ last.json 読み込み失敗 → 初期化:", err.message);
        oldData = {};
      }
    }

    let newData = { ...oldData };

    for (const target of TARGETS) {
      try {
        console.log(`🌐 取得中: ${target.url}`);

        const res = await axios.get(target.url, {
          timeout: 15000,
          headers: {
            "User-Agent": "Mozilla/5.0"
          }
        });

        const latest = parseLatest(target, res.data);

        if (!latest) {
          console.log("⚠ 最新情報を取得できず:", target.url);
          continue;
        }

        console.log(`📝 最新取得 [${target.key}] = ${latest.split("\n")[0]}`);

        const oldLatest = oldData[target.key];
        newData[target.key] = latest;

        // 初回起動時は保存だけして通知しない
        if (isFirst) {
          continue;
        }

        // 前回と同じなら通知しない
        if (oldLatest === latest) {
          continue;
        }

        // 直前に同じ内容を送っていたら通知しない（重複防止）
        if (wasRecentlySent(target.key, latest)) {
          console.log(`⛔ 重複通知防止 [${target.key}]`);
          continue;
        }

        console.log(`🆕 新規検出: ${target.key}`);
        console.log("📣 sendDiscord呼び出し前");

        const sent = await sendDiscord(`${target.message}\n\n${latest}`);

        console.log("📣 sendDiscord呼び出し後");

        if (sent) {
          markSent(target.key, latest);
        }

      } catch (err) {
        console.error("取得失敗:", target.url, err.message);
      }
    }

    fs.writeFileSync(FILE, JSON.stringify(newData, null, 2));
    console.log("💾 last.json 保存完了");

  } catch (err) {
    console.error("❌ 更新チェック全体エラー:", err);
  } finally {
    console.log("🔍 更新チェック終了");
    checking = false;
  }
}

/* =========================
   3分ごと実行
========================= */

cron.schedule("*/3 * * * *", async () => {
  console.log("🕒 cron発火:", new Date().toLocaleString("ja-JP"));
  await checkUpdate();
});

/* 起動直後にも1回実行（通知は初回なので飛ばない） */
setTimeout(() => {
  checkUpdate();
}, 10000);

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

/* =========================
   起動ログ
========================= */

console.log("Node:", process.version);
console.log("TOKEN:", process.env.DISCORD_TOKEN ? "OK" : "NG");
console.log("CHANNEL_ID:", process.env.CHANNEL_ID ? "OK" : "NG");
