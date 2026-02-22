import { Client, GatewayIntentBits } from "discord.js";
import axios from "axios";
import * as cheerio from "cheerio"; // ←ここ修正
import cron from "node-cron";
import fs from "fs";

const BLOG_URL = "https://lala.fanpla.jp/blog/listall/";
const DATA_FILE = "./last_blogs.json";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("clientReady", () => {
  console.log("Bot起動完了");
});

function loadOldData() {
  if (fs.existsSync(DATA_FILE)) {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  }
  return {};
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function getDiff(oldData, newData) {
  const diff = [];
  for (const cat in newData) {
    newData[cat].forEach(item => {
      const exists = oldData[cat]?.some(o => o.link === item.link);
      if (!exists) diff.push(item);
    });
  }
  return diff;
}

async function fetchBlogs() {
  try {
    const res = await axios.get(BLOG_URL);
    const $ = cheerio.load(res.data);

    const data = {};

    $(".block--bloglist").each((i, block) => {
      const category = $(block).find(".block--title .tit").text().trim();
      data[category] = [];

      $(block).find(".list__item").each((j, item) => {
        const title = $(item).find(".block--txt .tit").text().trim();
        const date = $(item).find(".wrap--data .date").text().trim();
        const link = $(item).find("a").attr("href");
        if (title && link) {
          data[category].push({
            date,
            title,
            link: `https://lala.fanpla.jp${link}`
          });
        }
      });
    });

    return data;
  } catch (err) {
    console.error("ブログ取得失敗:", err.message);
    return null;
  }
}

async function checkUpdate() {
  const oldData = loadOldData();
  const newData = await fetchBlogs();
  if (!newData) return;

  const diff = getDiff(oldData, newData);
  if (diff.length > 0) {
    const channel = await client.channels.fetch(process.env.CHANNEL_ID);
    for (const item of diff) {
      await channel.send(
        `📢 **新しいブログ更新**\n[${item.title}](${item.link})\n📅 ${item.date}`
      );
    }
    saveData(newData);
    console.log(diff.length, "件の新規ブログを通知しました");
  } else {
    console.log("新規ブログなし");
  }
}

cron.schedule("*/5 * * * *", checkUpdate);

client.login(process.env.DISCORD_TOKEN);
