import { Client, GatewayIntentBits } from "discord.js";
import axios from "axios";
import cheerio from "cheerio";
import cron from "node-cron";
import fs from "fs";

const TARGET_URL = "https://lala.fanpla.jp";
const FILE = "./last.txt";

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once("ready", () => {
  console.log("Bot起動完了");
});

// 差分抽出
function getDiff(oldText, newText) {
  if (!oldText) return null;

  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");

  const added = newLines.filter(line =>
    !oldLines.includes(line) && line.trim() !== ""
  );

  return added.slice(0, 10);
}

async function checkWebsite() {
  try {
    const res = await axios.get(TARGET_URL);
    const $ = cheerio.load(res.data);

    const text = $("body")
      .text()
      .replace(/\s+/g, "\n")
      .trim();

    let oldText = "";
    if (fs.existsSync(FILE)) {
      oldText = fs.readFileSync(FILE, "utf-8");
    }

    const diff = getDiff(oldText, text);

    if (diff && diff.length > 0 && oldText) {
      const channel = await client.channels.fetch(process.env.CHANNEL_ID);

      await channel.send(
        "📢 **Lalaサイト更新！**\n\n" +
        diff.join("\n") +
        "\n\n🔗 https://lala.fanpla.jp"
      );
    }

    fs.writeFileSync(FILE, text);

    console.log("チェック完了");

  } catch (err) {
    console.error("エラー:", err.message);
  }
}

// 5分ごとに実行
cron.schedule("*/5 * * * *", checkWebsite);

client.login(process.env.DISCORD_TOKEN);