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

// Express
const app = express();
app.get("/", (_, res) => res.send("Bot稼働中"));
app.listen(PORT, () => console.log(`🌐 Server running on port ${PORT}`));

// Discord
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once("clientReady", async () => {
  console.log("✅ Bot起動完了");

  // ----- スラッシュコマンド登録 -----
  const commands = [
    new SlashCommandBuilder()
      .setName("test")
      .setDescription("通知テストを送信します")
  ].map(cmd => cmd.toJSON());

  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: commands }
  );

  console.log("✅ /test コマンド登録完了");
});

// 通知（安全版）
async function sendDiscord(title, content) {
  try {
    console.log("Discord送信開始");

    const channel = await client.channels.fetch(process.env.CHANNEL_ID);

    await channel.send(`${title}\n\n${content}`);

    console.log("通知送信成功:", title);
  } catch (err) {
    console.error("Discord通知エラー:", err.message);
  }
}

// スラッシュコマンド処理
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "test") {
    await interaction.reply("テスト通知を送信します");

    await sendDiscord(
      "📢 **テスト通知**",
      "これはテストメッセージです"
    );
  }
});

// 最新1件取得
function getLatestBlog(html) {
  const $ = cheerio.load(html);
  const first = $("li.list__item").first();

  const title = first.find(".tit").text().trim();
  const linkPath = first.find("a").attr("href");

  if (!title || !linkPath) return null;

  return `${title}\nhttps://lala.fanpla.jp${linkPath}`;
}

// チェック
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
      const res = await axios.get(blog.url, {
        timeout: 10000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36"
        }
      });

      const latest = getLatestBlog(res.data);
      if (!latest) continue;

      newData[blog.url] = latest;

      if (isFirstRun) continue;

      if (oldData[blog.url] !== latest) {
        console.log("新規検出:", blog.url);
        await sendDiscord(blog.message, latest);
      }

    } catch (err) {
      console.error("取得失敗:", blog.url, err.message);
    }
  }

  fs.writeFileSync(FILE, JSON.stringify(newData, null, 2));

  console.log("🔍 ブログ更新チェック終了");
}

// cron
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

console.log("TOKEN確認:", process.env.DISCORD_TOKEN ? "OK" : "未設定");

client.login(process.env.DISCORD_TOKEN)
  .then(() => console.log("ログイン成功"))
  .catch(err => console.error("ログイン失敗:", err.message));
