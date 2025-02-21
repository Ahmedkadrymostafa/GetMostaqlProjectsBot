import puppeteer from "puppeteer";
import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";

dotenv.config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });

const URL = "https://mostaql.com/projects?category=marketing&budget_max=10000&sort=latest";
const KEYWORDS = ["google", "جوجل", "قوقل", "غوغل"];

async function scrapeProjects() {
    const browser = await puppeteer.launch({ 
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox"] // Ensure Puppeteer runs properly
    });
    
    const page = await browser.newPage();
    
    try {
        await page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        );
        await page.setViewport({ width: 1280, height: 800 });

        await page.goto(URL, { 
            waitUntil: "domcontentloaded", // Load the DOM
            timeout: 60000 
        });

        // Ensure elements exist before scraping
        await page.waitForSelector(".project-row .card--title h2 a", { timeout: 20000 });


        // Extract project titles and links
        const projects = await page.evaluate(() => {
            return Array.from(document.querySelectorAll(".project-row .card--title h2 a")).map((el) => ({
                title: el.innerText.trim(),
                link: el.href,
            }));
        });


        await browser.close();

        return projects;
    } catch (error) {
        console.error("Error scraping:", error);
        await browser.close();
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


