const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "tiktok",
    aliases: ["tik"],
    version: "3.3",
    author: "SaGor",
    role: 0,
    shortDescription: "Search and download TikTok videos",
    category: "media",
    guide: "{pn} <keyword or TikTok link>"
  },

  onStart: async function ({ api, event, args }) {
    const input = args.join(" ");
    if (!input) return api.sendMessage("🎵 Please provide a TikTok link or keyword.", event.threadID);

    const wait = await api.sendMessage("⏳ Searching TikTok videos...", event.threadID);

    try {
      if (input.includes("tiktok.com")) {
        const res = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(input)}`);
        const videoUrl = res.data.data.play;
        const filePath = path.join(__dirname, "cache", `tiktok_${Date.now()}.mp4`);
        const writer = fs.createWriteStream(filePath);
        const response = await axios({ method: "GET", url: videoUrl, responseType: "stream" });
        response.data.pipe(writer);
        writer.on("finish", async () => {
          await api.unsendMessage(wait.messageID);
          api.sendMessage({
            body: "✅ Video downloaded successfully!",
            attachment: fs.createReadStream(filePath)
          }, event.threadID, () => fs.unlinkSync(filePath));
        });
        return;
      }

      const res = await axios.get(`https://www.tikwm.com/api/feed/search?keywords=${encodeURIComponent(input)}`);
      const videos = res.data.data.videos;
      if (!videos || videos.length === 0) return api.sendMessage("❌ No videos found.", event.threadID);

      const top10 = videos.slice(0, 10);
      let msg = "🎬 𝗧𝗶𝗸𝗧𝗼𝗸 𝗦𝗲𝗮𝗿𝗰𝗵 𝗥𝗲𝘀𝘂𝗹𝘁𝘀:\n\n";
      top10.forEach((v, i) => {
        msg += `${i + 1}. ${v.title || "No title"}\n👤 ${v.author.nickname}\n\n`;
      });
      msg += "👉 Reply with a number (1–10) to download that video.";

      await api.unsendMessage(wait.messageID);
      api.sendMessage(msg, event.threadID, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: "tiktok",
          author: event.senderID,
          messageID: info.messageID,
          results: top10
        });
      });
    } catch {
      await api.unsendMessage(wait.messageID);
      api.sendMessage("❌ Error fetching videos. Try again later.", event.threadID);
    }
  },

  onReply: async function ({ api, event, Reply }) {
    const { author, results, messageID } = Reply;
    if (event.senderID !== author) return;
    const choice = parseInt(event.body.trim());
    if (isNaN(choice) || choice < 1 || choice > results.length)
      return api.sendMessage("⚠️ Please reply with a valid number (1–10).", event.threadID);

    const selected = results[choice - 1];
    await api.unsendMessage(messageID);

    const wait = await api.sendMessage("📥 Downloading selected video...", event.threadID);
    const filePath = path.join(__dirname, "cache", `tiktok_${Date.now()}.mp4`);
    const writer = fs.createWriteStream(filePath);
    const response = await axios({ method: "GET", url: selected.play, responseType: "stream" });
    response.data.pipe(writer);
    writer.on("finish", async () => {
      await api.unsendMessage(wait.messageID);
      api.sendMessage({
        body: `✅ ${selected.title || "TikTok Video"}\n👤 ${selected.author.nickname}`,
        attachment: fs.createReadStream(filePath)
      }, event.threadID, () => fs.unlinkSync(filePath));
    });
  }
};
