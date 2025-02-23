import fetch from "node-fetch";
import dotenv from "dotenv";
import * as cheerio from "cheerio"; 

dotenv.config();

// Telegram Bot Config
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

// URL to scrape
const MOSTAQL_URL = "https://mostaql.com/projects?category=marketing&budget_max=10000&sort=latest";

// Headers to simulate a real browser request
const HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Cookie": "your_cookie_here" // Optional, add if necessary
};

// Function to fetch and process the page
async function checkMostaqlProjects() {
    try {
        const response = await fetch(MOSTAQL_URL, { headers: HEADERS });
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

        const html = await response.text();
        const $ = cheerio.load(html);

        $(".project-row .card--title h2 a").each(async (_, element) => {
            const title = $(element).text().trim();
            const link = $(element).attr("href").startsWith("http") ? $(element).attr("href") : `https://mostaql.com${$(element).attr("href")}`;

            // Check if title contains target words
            if (/google|جوجل|قوقل|غوغل/i.test(title)) {
                console.log(`Matched Project: ${title}`);
                await sendTelegramMessage(`🔍 **New Project Found!**\n\n📌 **Title:** ${title}\n🔗 [View Project](${link})`);
            }
        });

    } catch (error) {
        console.error("Error fetching Mostaql:", error);
    }
}

// Function to send a Telegram message
async function sendTelegramMessage(text) {
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    const payload = {
        chat_id: CHAT_ID,
        text: text,
        parse_mode: "Markdown"
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`Telegram API Error: ${response.statusText}`);
        console.log("✅ Message sent to Telegram!");

    } catch (error) {
        console.error("Error sending message:", error);
    }
}

// Run every hour (3600000 ms)
setInterval(checkMostaqlProjects, 3600000);

// Run immediately on start
checkMostaqlProjects();
