const axios = require("axios");
const apiUrl = "https://baby-apis-nix.vercel.app";
const nix = ["😚", "Yes 😀, I am here", "What's up?", "Bolo jaan ki korte panmr jonno"];
const ok = ["baby", "bby", "bot", "বেবি", "জান", "jan", "বট", "বেবী", "বাবু", "janu"];
const getRand = () => nix[Math.floor(Math.random() * nix.length)];

module.exports.config = {
  name: "bby",
  aliases: ["baby"],
  version: "0.0.1",
  author: "ArYAN",
  cooldowns: 0,
  role: 0,
  shortDescription: "AI chat bot with learning",
  longDescription: "Chat bot with random replies, teaching, removing, editing",
  category: "chat",
  guide: {
    en: `{pn} [msg]\n{pn} teach [msg] - [reply1, reply2]\n{pn} teach react [msg] - [react1, react2]\n{pn} remove [msg]\n{pn} rm [msg] - [index or reply]\n{pn} list all\n{pn} list\n{pn} edit [msg] - [oldReply] - [newReply]`
  }
};

async function handleReply(api, event, text) {
  try {
    const res = await axios.get(`${apiUrl}/baby?text=${encodeURIComponent(text)}&senderID=${event.senderID}&font=1`);
    const aryan = res?.data?.reply;
    if (aryan) {
      api.sendMessage(aryan, event.threadID, (err, info) => {
        if (!err) {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: module.exports.config.name,
            type: "reply",
            messageID: info.messageID,
            author: event.senderID
          });
        }
      }, event.messageID);
    } else {
      api.sendMessage("❌ | No response found. Please teach me!", event.threadID, event.messageID);
    }
  } catch {
    api.sendMessage("❌ | Failed to fetch reply.", event.threadID, event.messageID);
  }
}

module.exports.onStart = async ({ api, event, args, usersData }) => {
  if (!event.body) return;
  const txt = args.join(" ").trim();
  const uid = event.senderID;

  try {
    if (!txt) return api.sendMessage(getRand(), event.threadID, event.messageID);
    const isCommand = ["remove", "rm", "list", "edit", "teach"].includes(args[0]);
    if (isCommand) {
      if (args[0] === "remove") {
        const key = txt.slice(7).trim();
        const res = await axios.get(`${apiUrl}/baby-remove?key=${encodeURIComponent(key)}`);
        return api.sendMessage(res.data.message || "Removed", event.threadID, event.messageID);
      }
      if (args[0] === "rm" && txt.includes("-")) {
        const parts = txt.slice(3).split(/\s*-\s*/).map(p => p.trim());
        const key = parts[0];
        const repOrIdx = parts[1];
        if (!key || repOrIdx === undefined) return api.sendMessage("❌ | Use: rm [msg] - [reply/index]", event.threadID, event.messageID);
        const param = !isNaN(parseInt(repOrIdx)) && String(parseInt(repOrIdx)) === repOrIdx ? `index=${encodeURIComponent(repOrIdx)}` : `reply=${encodeURIComponent(repOrIdx)}`;
        const res = await axios.get(`${apiUrl}/baby-remove?key=${encodeURIComponent(key)}&${param}`);
        return api.sendMessage(res.data.message || "Removed", event.threadID, event.messageID);
      }
      if (args[0] === "list") {
        if (args[1] === "all") {
          const tRes = await axios.get(`${apiUrl}/teachers`);
          const teachers = tRes.data.teachers || {};
          const sorted = Object.keys(teachers).sort((a, b) => teachers[b] - teachers[a]);
          const list = await Promise.all(sorted.map(async id => {
            const name = await usersData.getName(id).catch(() => id);
            return `• ${name}: ${teachers[id]}`;
          }));
          return api.sendMessage(`👑 | Teachers:\n${list.join("\n")}`, event.threadID, event.messageID);
        } else {
          const infoRes = await axios.get(`${apiUrl}/baby-info`);
          return api.sendMessage(`❇️ | Total Teach = ${infoRes.data.totalKeys || "api off"}\n♻️ | Total Response = ${infoRes.data.totalReplies || "api off"}`, event.threadID, event.messageID);
        }
      }
      if (args[0] === "edit") {
        const parts = txt.split(/\s*-\s*/).map(p => p.trim());
        if (parts.length < 3) return api.sendMessage("❌ | Use: edit [msg] - [oldReply] - [newReply]", event.threadID, event.messageID);
        const oldMsg = parts[0].replace("edit", "").trim();
        const oldReply = parts[1];
        const newReply = parts[2];
        if (!oldMsg || !oldReply || !newReply) return api.sendMessage("❌ | Use: edit [msg] - [oldReply] - [newReply]", event.threadID, event.messageID);
        const res = await axios.get(`${apiUrl}/baby-edit?key=${encodeURIComponent(oldMsg)}&oldReply=${encodeURIComponent(oldReply)}&newReply=${encodeURIComponent(newReply)}&senderID=${uid}`);
        return api.sendMessage(res.data.message || "Edited", event.threadID, event.messageID);
      }
      if (args[0] === "teach" && args[1] === "react") {
        const parts = txt.split(/\s*-\s*/).map(p => p.trim());
        const final = parts[0].replace("teach react", "").trim();
        const cmd = parts[1];
        if (!cmd) return api.sendMessage("❌ | Invalid format! Use: teach react [msg] - [react1, react2]", event.threadID, event.messageID);
        const res = await axios.get(`${apiUrl}/baby?teach=${encodeURIComponent(final)}&react=${encodeURIComponent(cmd)}`);
        return api.sendMessage(res.data.message, event.threadID, event.messageID);
      }
      if (args[0] === "teach") {
        const parts = txt.split(/\s*-\s*/).map(p => p.trim());
        const final = parts[0].replace("teach", "").trim();
        const cmd = parts[1];
        if (!cmd) return api.sendMessage("❌ | Invalid format! Use: teach [msg] - [reply1, reply2]", event.threadID, event.messageID);
        const res = await axios.get(`${apiUrl}/baby?teach=${encodeURIComponent(final)}&reply=${encodeURIComponent(cmd)}&senderID=${uid}`);
        const teacher = await usersData.getName(uid).catch(() => uid);
        if (res.data.addedReplies?.length === 0) {
          const existingMsg = res.data.existingReplies.join(", ");
          return api.sendMessage(`❌ | All replies already exist for this question.\nExisting: ${existingMsg}`, event.threadID, event.messageID);
        }
        const teachsRes = await axios.get(`${apiUrl}/teachers`);
        const teachCount = teachsRes.data.teachers[uid] || 0;
        const addedReplies = res.data.addedReplies?.join(", ") || cmd;
        return api.sendMessage(`✅ | Replies added "${addedReplies}" added to "${final}".\nTeacher: ${teacher}\nTeachs: ${teachCount}`, event.threadID, event.messageID);
      }
    }
    handleReply(api, event, txt);
  } catch {
    api.sendMessage("❌ | Something went wrong.", event.threadID, event.messageID);
  }
};

module.exports.onReply = async ({ api, event }) => {
  if (!event.messageReply?.body) return;
  handleReply(api, event, event.body.toLowerCase());
};

module.exports.onChat = async ({ api, event }) => {
  if (event.senderID === api.getCurrentUserID() || !event.body) return;
  const txt = event.body.toLowerCase().trim();
  const parts = txt.split(" ");
  const firstWord = parts[0];
  if (!ok.includes(firstWord)) return;
  const rest = parts.slice(1).join(" ").trim();
  if (!rest) {
    const message = getRand();
    return api.sendMessage(message, event.threadID, (err, info) => {
      if (!err) {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: module.exports.config.name,
          type: "reply",
          messageID: info.messageID,
          author: event.senderID
        });
      }
    }, event.messageID);
  }
  handleReply(api, event, rest);
};
