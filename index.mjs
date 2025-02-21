import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import axios from "axios";
import * as cheerio from "cheerio";

dotenv.config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });

const URL = "https://mostaql.com/projects?category=marketing&budget_max=10000&sort=latest";
const KEYWORDS = ["google", "جوجل", "قوقل", "غوغل"];


async function scrapeProjects() {
    try {
        // Fetch the HTML content of the page
        const { data } = await axios.get(URL, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            },
        });

        // Load HTML into Cheerio
        const $ = cheerio.load(data);

        // Select project titles and links
        const projects = [];
        $(".project-row .card--title h2 a").each((_, el) => {
            const title = $(el).text().trim();
            const link = $(el).attr("href");

            // Check if the title contains keywords
            if (/google|جوجل|قوقل|غوغل/i.test(title)) {
                projects.push({ title, link: `https://mostaql.com${link}` });
            }
        });

        return projects;
    } catch (error) {
        console.error("Error scraping:", error);
        return [];
    }
}

async function checkAndSendProjects() {
    console.log("Checking for new projects...");
    
    const projects = await scrapeProjects();

    for (const project of projects) {
        if (KEYWORDS.some((keyword) => project.title.toLowerCase().includes(keyword))) {
            const message = `🔹 *New Project Found!*\n\n*Title:* ${project.title}\n🔗 [View Project](${project.link})`;
            
            bot.sendMessage(TELEGRAM_CHAT_ID, message, { parse_mode: "Markdown" });
        }
    }

    console.log("Check completed.");
}

// Run the script every hour
setInterval(checkAndSendProjects, 60 * 60 * 1000);

// Run immediately on start
checkAndSendProjects();


