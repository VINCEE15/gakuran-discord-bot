require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
} = require("discord.js");

const { checkCodes } = require("./codeChecker");
const axios = require("axios");
const cheerio = require("cheerio");
const cron = require("node-cron");
const fs = require("fs");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

client.once("clientReady", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  // Check immediately
  checkCodes(client);

  // Check every 5 minutes
  cron.schedule("*/5 * * * *", () => {
    checkCodes(client);
  });
});

client.on("messageCreate", async (message) => {
  try {
    // Ignore bots
    if (message.author.bot) return;

    // Only accept DMs
    if (message.guild) return;

    // Only allow you
    if (message.author.id !== process.env.OWNER_ID) {
      console.log("❌ Unauthorized user:", message.author.id);
      return;
    }

    console.log(`📩 Received DM: ${message.content}`);

    // Get announcement channel
    const channel = await client.channels.fetch(
      process.env.UPDATES_CHANNEL_ID
    );

    if (!channel) {
      console.log("❌ Announcement channel not found.");
      return;
    }

    const embed = new EmbedBuilder()
      .setColor("#5865F2")
      .setTitle("📢 Gakuran Update")
      .setDescription(
        message.content.length > 0
          ? message.content
          : "*No text provided.*"
      )
      .setTimestamp()
      .setFooter({
        text: "Relayed manually by Vince",
      });

    const files = [];

    for (const attachment of message.attachments.values()) {
      files.push(attachment.url);
    }

    await channel.send({
      embeds: [embed],
      files,
    });

    await message.reply("✅ Announcement posted successfully!");

    console.log("✅ Announcement sent.");
  } catch (err) {
    console.error("❌ Error:", err);
  }
});

client.login(process.env.TOKEN);