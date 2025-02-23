import fetch from "node-fetch";
import dotenv from "dotenv";
import * as cheerio from "cheerio"; 
import { HttpsProxyAgent } from "https-proxy-agent";

dotenv.config();

// Telegram Bot Config
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

// URL to scrape
const MOSTAQL_URL = "https://mostaql.com/projects?category=marketing&budget_max=10000&sort=latest";

// Headers to simulate a real browser request
const HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:110.0) Gecko/20100101 Firefox/110.0",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Referer": "https://www.google.com/",
    "Cookie": "XSRF-TOKEN=eyJpdiI6IjlLQm1ESkNXUXpjZEp5WkVGUVByQ2c9PSIsInZhbHVlIjoiTnlxQWx1UGJtQVpvczFBS1ZJMDR0ek5tUzBSUFJiaWdmdzk5bFhMZ29ndHA5dGxteFJxY2NhaGhMTFNHajVrUjhRNGFyK2QzaWVnekkzVHA5Q3Y2UzhtamdocG0vZytJZUdTTmRxMnllOGNpUnR2RFkyUENjSlg1TXd1cGMzTE8iLCJtYWMiOiI0OGE5MWJkNjJjYzNmYWYzMDAwOTFiMWRiYzQ1ZDc4OTI4ZmM2YWQ4MDU4YTRmOTcxOWE2YWVmZThjMDI4ZTIxIiwidGFnIjoiIn0%3D; mostaqlweb=eyJpdiI6Ikw1SmI3Um9rekZaVXQ1TU9Femhta3c9PSIsInZhbHVlIjoiZm5PZHpVaGpwSW9Nays1QSs5aHpKM2VmbHRpeE1EamJjNHRZN3NWWm9RT2VGeExQSWxRTmxFSG8vcGIyTWFkTHlOS25oeWpNWldvUEIxVjVyeVREWVNVbWF4UTM2THN5U0tQc3NrdjdWN3hMSmxkOTNvcUpIazNZbi9zZUluangiLCJtYWMiOiI4ZDQ0MjQwMmI3YTQ5NDkxZDFkZDZmMmI1ZTk1ZDdmYWVjYjA1NTBmYzdmYTY1NjcwNThhMjg1YTk3M2ViYTYwIiwidGFnIjoiIn0%3D;"
};

// Function to fetch and process the page
async function checkMostaqlProjects() {
    try {
        const proxyUrl = "http://18.223.25.15:80";
        const agent = new HttpsProxyAgent(proxyUrl);
        
        const response = await fetch(MOSTAQL_URL, {
            headers: HEADERS,
        });
        // const response = await fetch(MOSTAQL_URL, { headers: HEADERS });
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
