const { Builder } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const path = require("path");
const os = require("os");
const fs = require("fs");

class BrowserService {

  async startBrowser(account) {

    const options = new chrome.Options();

    // folder chứa tất cả profile
    const baseProfileDir = path.join(
      os.homedir(),
      "coinpayu-profiles"
    );

    // profile riêng cho từng account
    const profileDir = path.join(
      baseProfileDir,
      account.username.replace(/[^a-zA-Z0-9]/g, "_")
    );

    // tạo folder nếu chưa tồn tại
    fs.mkdirSync(profileDir, { recursive: true });

    console.log("Using chrome profile:", profileDir);

    // dùng profile chrome thật
    options.addArguments(`--user-data-dir=${profileDir}`);

    // các flag giúp giống user thật hơn
    options.addArguments("--start-maximized");
    options.addArguments("--disable-blink-features=AutomationControlled");
    options.addArguments("--disable-infobars");
    options.addArguments("--lang=en-US");

    // tránh crash chrome (nhất là VPS)
    options.addArguments("--no-sandbox");
    options.addArguments("--disable-dev-shm-usage");

    const driver = await new Builder()
      .forBrowser("chrome")
      .setChromeOptions(options)
      .build();

    // ẩn webdriver flag
    await driver.executeScript(`
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined
      });
    `);

    // fake platform / languages giống user
    await driver.executeScript(`
      Object.defineProperty(navigator, 'platform', {
        get: () => 'Win32'
      });

      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US','en']
      });
    `);

    // mở trang login
    await driver.get("https://www.coinpayu.com/login");

    return driver;
  }
}

module.exports = BrowserService;