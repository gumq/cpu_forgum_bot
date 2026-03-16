require("dotenv").config();

const cron = require("node-cron");
const accounts = require("./accounts.json");

const BrowserService = require("./services/browserService");
const SurfService = require("./services/surfService");
const sendTelegram = require("./telegram");

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function randomStart(windowMinutes) {
  const delay = random(0, windowMinutes * 60 * 1000);

  console.log("Random start delay:", delay / 1000, "seconds");

  await sleep(delay);
}

async function runAccounts() {
  console.log("Coinpayu job started");

  for (const acc of accounts) {
    console.log("Start account:", acc.username);
    // await sendTelegram(`Start account ${acc.username}`);
    const browser = new BrowserService();
    const driver = await browser.startBrowser();

    const surf = new SurfService(driver, acc);

    try {
      const result = await surf.startSurf();

      if (result && result.status === "DONE") {
        await sendTelegram(
          `Coinpayu account ${acc.username} finished.\nCompleted ads: ${result.completed}`,
        );
      }
    } catch (err) {
      console.log("Account error:", err.message);
    }

    await driver.quit();

    const delay = random(60000, 180000);

    console.log("Wait before next account:", delay / 1000, "seconds");

    await sleep(delay);
  }

  console.log("All accounts finished");
}

cron.schedule("45 7 * * *", async () => {
  await randomStart(35);

  await runAccounts();
});

cron.schedule("24 19 * * *", async () => {
  await randomStart(35);

  await runAccounts();
});
cron.schedule("48 11 * * *", async () => {
  console.log("Cron triggered at 10:32");

  await randomStart(1); // test delay nhỏ

  await runAccounts();
});

console.log("Scheduler started");
