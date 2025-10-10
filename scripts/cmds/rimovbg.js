const fs = require("fs");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");

module.exports = {
  config: {
    name: "removebg",
    aliases: ["bgremove", "rmbg"],
    version: "1.0",
    author: "SaGor",
    role: 0,
    category: "photo",
    shortDescription: "Remove background from an image",
    guide: "{pn} reply to an image or send image URL"
  },

  onStart: async function({ api, event, args }) {
    let imageUrl;
    if (event.messageReply && event.messageReply.attachments.length > 0) imageUrl = event.messageReply.attachments[0].url;
    else if (args[0]) imageUrl = args[0];
    else return api.sendMessage("❌ Please reply to an image or provide a URL.", event.threadID);

    const wait = await api.sendMessage("🖌 Removing background, please wait...", event.threadID);

    try {
      const formData = new FormData();
      formData.append("image_url", imageUrl);
      formData.append("size", "auto");

      const res = await axios.post("https://api.remove.bg/v1.0/removebg", formData, {
        responseType: "arraybuffer",
        headers: { ...formData.getHeaders(), "X-Api-Key": "iDCaLMAZ9FEUkGiWUbZRbH1d" },
        encoding: null
      });

      const filePath = path.join(__dirname, `/cache/removebg_${Date.now()}.png`);
      fs.writeFileSync(filePath, res.data);

      await api.unsendMessage(wait.messageID);
      api.sendMessage({ body: "✅ Background removed successfully!", attachment: fs.createReadStream(filePath) }, event.threadID, () => fs.unlinkSync(filePath));

    } catch (err) {
      await api.unsendMessage(wait.messageID);
      api.sendMessage("❌ Failed to remove background. Please check the image or API key.", event.threadID);
    }
  }
};
