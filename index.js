const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const axios = require("axios");
const fetch = require("node-fetch");
const { QuickDB } = require("quick.db");

const db = new QuickDB();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const prefix = "!";

client.once("ready", () => {
    console.log(`🔥 ${client.user.tag} is ONLINE with AI + DB + LEVELS`);
});

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    // ========================
    // 💾 LEVEL SYSTEM (PERMANENT)
    // ========================
    let xp = await db.get(`xp_${message.author.id}`) || 0;
    let level = await db.get(`level_${message.author.id}`) || 1;

    xp += 5;

    if (xp >= level * 50) {
        level++;
        xp = 0;

        await db.set(`level_${message.author.id}`, level);
        await db.set(`xp_${message.author.id}`, xp);

        message.reply(`✨ ${message.author.username} leveled up to **${level}**!`);
    } else {
        await db.set(`xp_${message.author.id}`, xp);
    }

    // ========================
    // 🤖 AUTO ANIME REPLIES
    // ========================
    const content = message.content.toLowerCase();

    if (content.includes("hi") || content.includes("hello")) {
        return message.reply("✨ Konnichiwaa~");
    }

    if (content.includes("bye")) {
        return message.reply("👋 Sayonara...");
    }

    if (content.includes("love")) {
        return message.reply("❤️ Love is like anime… complicated 😏");
    }

    // ========================
    // COMMANDS
    // ========================
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // 🏓 ping
    if (command === "ping") {
        return message.reply("Pong 🏓");
    }

    // 😂 meme
    if (command === "meme") {
        try {
            const res = await axios.get("https://meme-api.com/gimme");
            return message.reply(res.data.url);
        } catch {
            return message.reply("Meme nahi mila 😢");
        }
    }

    // 🎲 roll
    if (command === "roll") {
        return message.reply(`🎲 ${Math.floor(Math.random() * 100) + 1}`);
    }

    // 📢 say
    if (command === "say") {
        const text = args.join(" ");
        if (!text) return message.reply("Kya bolu?");
        return message.channel.send(text);
    }

    // 👤 userinfo
    if (command === "userinfo") {
        const embed = new EmbedBuilder()
            .setTitle("👤 User Info")
            .addFields(
                { name: "Username", value: message.author.tag, inline: true },
                { name: "Level", value: `${level}`, inline: true }
            )
            .setColor("Purple");

        return message.reply({ embeds: [embed] });
    }

    // 📊 rank
    if (command === "rank") {
        return message.reply(`📊 Level: ${level} | XP: ${xp}`);
    }

    // 😂 joke
    if (command === "joke") {
        try {
            const res = await axios.get("https://official-joke-api.appspot.com/random_joke");
            return message.reply(`${res.data.setup}\n${res.data.punchline}`);
        } catch {
            return message.reply("Joke nahi mila 😢");
        }
    }

    // 🤖 AI CHAT (MAIN FEATURE)
    if (command === "ai") {
        const prompt = args.join(" ");
        if (!prompt) return message.reply("Kya puchna hai?");

        try {
            const res = await fetch(
                `https://api.popcat.xyz/chatbot?msg=${encodeURIComponent(prompt)}&owner=Tejas&botname=AnimeBot`
            );
            const data = await res.json();

            return message.reply(`✨ AI: ${data.response}`);
        } catch {
            return message.reply("AI abhi busy hai 😴");
        }
    }
});

client.login("MTUwMzAyMDIyNDEwNDg5MDQ2OA.G_Wt0s.K2X7G__jcMoevZxS-J5sxNPEFqEj9drkHYWziY");
