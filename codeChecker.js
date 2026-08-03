const axios = require("axios");
const cheerio = require("cheerio");
const { EmbedBuilder } = require("discord.js");

async function checkCodes(client) {
    try {
        console.log("🔍 Checking Gakuran codes...");

        const { data } = await axios.get(
            "https://beebom.com/gakuran-codes/",
            {
                headers: {
                    "User-Agent": "Mozilla/5.0"
                }
            }
        );

        const $ = cheerio.load(data);

        const activeCodes = [];
        const expiredCodes = [];

        let section = "";

        $("h2, h3, li").each((i, el) => {

            const text = $(el).text().trim();

            // Detect sections
            if (text.includes("All New Gakuran Codes")) {
                section = "active";
                return;
            }

            if (text.includes("Expired Gakuran Codes")) {
                section = "expired";
                return;
            }


            // Extract codes
            if (text.includes(":")) {

                let code = text.split(":")[0]
                    .replace(/[^A-Z0-9*_-]/gi, "")
                    .trim();


                if (!code) return;


                if (section === "active") {
                    activeCodes.push(code);
                }


                if (section === "expired") {
                    expiredCodes.push(code);
                }
            }

        });


        const uniqueActive = [...new Set(activeCodes)];
        const uniqueExpired = [...new Set(expiredCodes)];


        console.log("✅ Active:", uniqueActive);
        console.log("❌ Expired:", uniqueExpired);



        // Get tracker channel
    const channel = await client.channels.fetch(
    process.env.CODES_CHANNEL_ID
);

let message;

try {
    message = await channel.messages.fetch(
        process.env.CODE_MESSAGE_ID
    );

} catch (err) {

    console.log("Creating tracker message...");

    message = await channel.send({
        content: "🎁 Gakuran Codes Tracker\n⏳ Updating..."
    });

    console.log("SAVE THIS MESSAGE ID:", message.id);
}


        const embed = new EmbedBuilder()
            .setColor("#5865F2")
            .setTitle("🎁 Gakuran Codes Tracker")
            .setDescription(
                `##  Active Codes\n${
                    uniqueActive.length
                        ? uniqueActive.map(c => `• ${c}`).join("\n")
                        : "No active codes"
                }\n\n` +

                `##  Expired Codes\n${
                    uniqueExpired.length
                        ? uniqueExpired.map(c => `• ${c}`).join("\n")
                        : "No expired codes"
                }`
            )
            .setFooter({
                text: "Source: Beebom"
            })
            .setTimestamp();


        await message.edit({
            embeds: [embed]
        });


        console.log("✅ Tracker updated.");

    } catch (err) {

        console.error(
            "Code checker error:",
            err.message
        );

    }
}


module.exports = { checkCodes };