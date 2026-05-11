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
    console.log(`🔥 ${client.user.tag} is ONLINE`);
});

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    // ===== LEVEL SYSTEM =====
    let data = await db.get(`user_${message.author.id}`);
    if (!data) data = { xp: 0, level: 1 };

    const xpGain = Math.floor(Math.random() * 10) + 5;
    data.xp += xpGain;

    let neededXP = data.level * 100;

    if (data.xp >= neededXP) {
        data.level++;
        data.xp -= neededXP;

        message.reply(`🔥 ${message.author.username} reached level **${data.level}**!`);
    }

    await db.set(`user_${message.author.id}`, data);

    // ===== AUTO REPLIES =====
    const content = message.content.toLowerCase();
    if (content.includes("hi") || content.includes("hello")) return message.reply("✨ Konnichiwaa~");
    if (content.includes("bye")) return message.reply("👋 Sayonara...");
    if (content.includes("love")) return message.reply("❤️ Love is complicated 😏");

    // ===== COMMANDS =====
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // HELP
    if (command === "help") {
        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle("📜 Commands")
                    .setDescription(`
⚙️ !help   !ping   !userinfo   !serverinfo   !avatar  
😂 !meme !joke !roll !8ball  
🎭 !hug !slap !quote  
🎮 !rank !leaderboard  
`)
                    .setColor("Blue")
            ]
        });
    }

    // USERINFO
    if (command === "userinfo") {
        const user = message.mentions.users.first() || message.author;

        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle("👤 User Info")
                    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                    .addFields(
                        { name: "Username", value: user.username, inline: true },
                        { name: "User ID", value: user.id, inline: true }
                    )
                    .setColor("Purple")
            ]
        });
    }

    // SERVERINFO FULL
    if (command === "serverinfo") {
        const g = message.guild;

        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle(`🏠 ${g.name}`)
                    .setThumbnail(g.iconURL({ dynamic: true }))
                    .addFields(
                        { name: "Created", value: `<t:${Math.floor(g.createdTimestamp/1000)}:R>`, inline: true },
                        { name: "Members", value: `${g.memberCount}`, inline: true },
                        { name: "Boosters", value: `${g.premiumSubscriptionCount || 0}`, inline: true },

                        { name: "Channels", value: 
                            `Categories: ${g.channels.cache.filter(c=>c.type===4).size || 0}
Text: ${g.channels.cache.filter(c=>c.type===0).size || 0}
Voice: ${g.channels.cache.filter(c=>c.type===2).size || 0}`, inline: true },

                        { name: "Counts", value:
                            `Stickers: ${g.stickers?.cache?.size || 0}
Emojis: ${g.emojis.cache.size || 0}
Roles: ${g.roles.cache.size || 0}`, inline: true },

                        { name: "Boost", value:
                            `Level: ${g.premiumTier || 0}
Boosts: ${g.premiumSubscriptionCount || 0}`, inline: true },

                        { name: "Design", value:
                            `Icon: ${g.iconURL() ? "Yes" : "None"}
Banner: ${g.banner ? "Yes" : "None"}
Splash: ${g.splash ? "Yes" : "None"}`, inline: true },

                        { name: "System", value:
                            `Verification: ${g.verificationLevel}
MFA: ${g.mfaLevel}
Vanity: ${g.vanityURLCode || "None"}`, inline: true }
                    )
                    .setColor("Blue")
            ]
        });
    }

    // RANK
    if (command === "rank") {
        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle("📊 Rank")
                    .addFields(
                        { name: "Level", value: `${data.level}`, inline: true },
                        { name: "XP", value: `${data.xp}/${data.level*100}`, inline: true }
                    )
                    .setColor("Green")
            ]
        });
    }

    // LEADERBOARD
    if (command === "leaderboard") {
        const all = await db.all();

        const users = all
            .filter(e => e.id.startsWith("user_"))
            .map(e => ({
                id: e.id.replace("user_", ""),
                level: e.value.level,
                xp: e.value.xp
            }))
            .sort((a,b)=>(b.level*100+b.xp)-(a.level*100+a.xp))
            .slice(0,5);

        let desc = "";

        for (let i = 0; i < users.length; i++) {
            const u = await client.users.fetch(users[i].id);
            desc += `**${i+1}.** ${u.username} — Level ${users[i].level}\n`;
        }

        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle("🏆 Leaderboard")
                    .setDescription(desc || "No data")
                    .setColor("Orange")
            ]
        });
    }

    // HUG
    if (command === "hug") {
        const user = message.mentions.users.first();
        if (!user) return message.reply("Kise hug karu? 😳");

        const res = await axios.get("https://nekos.life/api/v2/img/hug");

        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setDescription(`🤗 ${message.author.username} hugged ${user.username}`)
                    .setImage(res.data.url)
                    .setColor("#ff4da6")
            ]
        });
    }

    // SLAP
    if (command === "slap") {
        const user = message.mentions.users.first();
        if (!user) return message.reply("Kise slap karu? 😏");

        const res = await axios.get("https://nekos.life/api/v2/img/slap");

        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setDescription(`👋 ${message.author.username} slapped ${user.username}`)
                    .setImage(res.data.url)
                    .setColor("Red")
            ]
        });
    }

    // QUOTE API
    if (command === "quote") {
        try {
            const res = await axios.get("https://api.quotable.io/random");

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(`"${res.data.content}"`)
                        .setFooter({ text: `— ${res.data.author}` })
                        .setColor("Gold")
                ]
            });
        } catch {
            return message.reply("Quote nahi mila 😢");
        }
    }

    // BASIC COMMANDS
    if (command === "ping") return message.reply("Pong 🏓");

    if (command === "meme") {
        const res = await axios.get("https://meme-api.com/gimme");
        return message.reply(res.data.url);
    }

    if (command === "joke") {
        const res = await axios.get("https://official-joke-api.appspot.com/random_joke");
        return message.reply(`${res.data.setup}\n${res.data.punchline}`);
    }

    if (command === "roll") {
        return message.reply(`🎲 ${Math.floor(Math.random()*100)+1}`);
    }

    if (command === "8ball") {
        const replies = ["Yes 😏","No 😢","Maybe 🤔","Definitely 🔥","Not sure..."];
        return message.reply(replies[Math.floor(Math.random()*replies.length)]);
    }

    if (command === "avatar") {
        const user = message.mentions.users.first() || message.author;
        return message.reply(user.displayAvatarURL({ dynamic:true, size:1024 }));
    }

    if (command === "say") {
        const text = args.join(" ");
        if (!text) return message.reply("Kya bolu?");
        return message.channel.send(text);
    }

    if (command === "remind") {
        const time = parseInt(args[0]);
        const text = args.slice(1).join(" ");

        if (!time || !text) return message.reply("Use: !remind 5 study");

        message.reply(`⏰ Reminder set`);
        setTimeout(()=> message.reply(`🔔 ${text}`), time*1000);
    }

    if (command === "ai") {
        const prompt = args.join(" ");
        if (!prompt) return message.reply("Kya puchna hai?");

        const res = await fetch(`https://api.popcat.xyz/chatbot?msg=${encodeURIComponent(prompt)}&owner=Tejas&botname=AnimeBot`);
        const d = await res.json();

        return message.reply(`✨ ${d.response}`);
    }
});

client.login("YOUR_BOT_TOKEN");
