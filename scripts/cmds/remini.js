const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "remini",
    aliases: ["enhance", "enhanceimg"],
    version: "1.0",
    author: "SaGor",
    role: 0,
    category: "photo",
    shortDescription: "Enhance image using Remini API",
    guide: "{pn} reply to an image or send image URL"
  },

  onStart: async function({ api, event, args }) {
    let imageUrl;

    if (event.messageReply && event.messageReply.attachments.length > 0) {
      imageUrl = event.messageReply.attachments[0].url;
    } else if (args[0]) {
      imageUrl = args[0];
    } else {
      return api.sendMessage("❌ Please reply to an image or provide a URL.", event.threadID);
    }

    const wait = await api.sendMessage("🔍 Enhancing image, please wait...", event.threadID);

    try {
      const apiKey = "4fe7e522-70b7-420b-a746-d7a23db49ee5";

      const response = await axios.get(`https://kaiz-apis.gleeze.com/api/remini?url=${encodeURIComponent(imageUrl)}&stream=true&apikey=${apiKey}`, {
        responseType: "arraybuffer"
      });

      const filePath = path.join(__dirname, `/cache/remini_${Date.now()}.png`);
      fs.writeFileSync(filePath, response.data);

      await api.unsendMessage(wait.messageID);
      api.sendMessage({ body: "✅ Image enhanced successfully!", attachment: fs.createReadStream(filePath) }, event.threadID, () => fs.unlinkSync(filePath));

    } catch (err) {
      await api.unsendMessage(wait.messageID);
      api.sendMessage("❌ Failed to enhance image. Please check the URL or API key.", event.threadID);
    }
  }
};
