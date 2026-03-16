const { Builder } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

const userAgents = [
"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/145 Safari/537.36",
"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/145 Safari/537.36",
"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/145 Safari/537.36"
];

function randomUA() {

    return userAgents[Math.floor(Math.random() * userAgents.length)];
}

class BrowserService {

    async startBrowser() {

        const options = new chrome.Options();

        options.addArguments("--start-maximized");
        options.addArguments("--disable-blink-features=AutomationControlled");

        options.addArguments(`--user-agent=${randomUA()}`);

        const driver = await new Builder()
            .forBrowser("chrome")
            .setChromeOptions(options)
            .build();

        await driver.get("https://www.coinpayu.com/login");

        return driver;
    }

}

module.exports = BrowserService;