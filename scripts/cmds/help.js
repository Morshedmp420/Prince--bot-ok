module.exports = {
  config: {
    name: "help",
    aliases: ["menu", "cmd", "commands"],
    version: "6.0",
    author: "SaGor",
    countDown: 3,
    role: 0,
    shortDescription: "Show all commands or details of one command",
    longDescription: "Displays all commands by category or detailed info for a specific command",
    category: "system",
    guide: { en: "{pn} [command name]" }
  },

  onStart: async function ({ api, event, args }) {
    const prefix = global.GoatBot.config.prefix;
    const commands = global.GoatBot.commands;

    if (args[0]) {
      const name = args[0].toLowerCase();
      const cmd =
        commands.get(name) ||
        [...commands.values()].find(c => c.config.aliases?.includes(name));

      if (!cmd)
        return api.sendMessage(`❌ Command "${name}" not found!`, event.threadID, event.messageID);

      const info = cmd.config;
      let msg = `╭─❖🌟 ${info.name.toUpperCase()} 🌟❖─╮\n\n`;
      msg += `👑 Author  : ${info.author}\n`;
      msg += `⚙️ Version : ${info.version}\n`;
      msg += `📂 Category: ${info.category}\n`;
      msg += `🕒 Cooldown: ${info.countDown || 3}s\n`;
      msg += `🎯 Role    : ${info.role}\n`;
      msg += `💬 Desc    : ${info.shortDescription}\n`;
      msg += `💡 Usage   : ${prefix}${info.guide?.en || info.name}\n`;
      msg += info.aliases?.length ? `🔁 Aliases : ${info.aliases.join(", ")}\n` : "";
      msg += `\n╰────────• 🌸 •──────────╯\n✨ Made by: SaGor`;
      return api.sendMessage(msg, event.threadID, event.messageID);
    }

    let cats = {};
    for (const [n, c] of commands.entries()) {
      const cat = c.config.category || "Other";
      if (!cats[cat]) cats[cat] = [];
      cats[cat].push(c.config.name);
    }

    let msg = `╭━━━━━✨ 𝗕𝗢𝗧 𝗛𝗘𝗟𝗣 ✨━━━━━╮\n`;
    msg += `┃ ⚡ Prefix       : ${prefix}\n`;
    msg += `┃ 📜 Total Cmds  : ${commands.size}\n`;
    msg += `╰━━━━━━━━━━━━━━━━━━━━━╯\n\n`;

    for (const [cat, cmds] of Object.entries(cats)) {
      msg += `🌈  ┏━━━ ${cat.toUpperCase()} [${cmds.length}] ━━━┓\n`;
      msg += `┃ ${cmds.sort().map(c=>` • ${c}`).join(" | ")}\n`;
      msg += `┗━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
    }

    msg += `💡 Usage   : ${prefix}help [command]\n`;
    msg += `🧩 Example : ${prefix}help ai\n`;
    msg += `\n✨ Crafted with ❤️ by prince morshed`;

    api.sendMessage(msg, event.threadID, event.messageID);
  }
};
