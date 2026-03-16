const { By, until } = require("selenium-webdriver");
const fs = require("fs");

let blockedAds = [];
let attemptedAds = new Set();

try {
  blockedAds = JSON.parse(fs.readFileSync("blockedAds.json"));
} catch {
  blockedAds = [];
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

class SurfService {
  constructor(driver, account) {
    this.driver = driver;
    this.account = account;
  }
  async warmupProfile() {
    console.log("Warming up browser profile...");

    // Google search
    await this.driver.get("https://www.google.com");
    await sleep(3000);

    try {
      const search = await this.driver.findElement(By.name("q"));
      await search.sendKeys("QMEDIA THUYẾT MINH videos\n");
    } catch {}

    await sleep(5000);

    // YouTube video
    await this.driver.get(
      "https://www.youtube.com/watch?v=8sVtL0o-v7U&list=RDMM8sVtL0o-v7U&start_radio=1",
    );
    await sleep(20000);

    // Dailymotion video (xem 5s)
    await this.driver.get("https://www.dailymotion.com/user/gumq/playlists");
    await sleep(5000);

    // Trang 24h.com.vn
    await this.driver.get("https://24h.com.vn/");
    await sleep(3000);

    const end = Date.now() + 20000;

    while (Date.now() < end) {
      const scroll = random(300, 700);

      await this.driver.executeScript(`window.scrollBy(0, ${scroll})`);

      await sleep(random(1000, 2500));
    }

    console.log("Warmup finished");
  }
  async startSurf() {
    attemptedAds = new Set();
    await this.warmupProfile();
    await this.login();
    await this.openSurfAds();

    return await this.surfAdsLoop();
  }

  async login() {
    const emailValue = this.account.username;
    const passValue = this.account.password;

    console.log("Opening login page...");

    await this.driver.get("https://www.coinpayu.com/login");

    await sleep(4000);

    // kiểm tra đã login chưa
    const currentUrl = await this.driver.getCurrentUrl();

    if (!currentUrl.includes("/login")) {
      console.log("Already logged in → skip login");

      return;
    }

    // thử tìm ô email
    let emailInput;

    try {
      emailInput = await this.driver.wait(
        until.elementLocated(By.css("input[placeholder='Email']")),
        5000,
      );
    } catch {
      console.log("Login form not found → assume already logged in");

      return;
    }

    console.log("Typing email...");

    await emailInput.sendKeys(emailValue);

    await sleep(random(800, 1500));

    const pass = await this.driver.findElement(
      By.css("input[type='password']"),
    );

    console.log("Typing password...");

    await pass.sendKeys(passValue);

    await sleep(random(1000, 2000));

    const btn = await this.driver.findElement(By.css("button.cp-btn--primary"));

    console.log("Click login");

    await btn.click();

    await this.driver.wait(async () => {
      const url = await this.driver.getCurrentUrl();

      return !url.includes("/login");
    }, 20000);

    console.log("Login success:", emailValue);
  }

  async openSurfAds() {
    await this.driver.get("https://www.coinpayu.com/dashboard/ads_surf");

    await sleep(5000);

    await this.closePopup();
  }

  async closePopup() {
    try {
      const btn = await this.driver.findElement(
        By.css(".currency-notice-confirm-btn"),
      );

      await btn.click();

      console.log("Popup closed");
    } catch {}
  }

  async simulateHumanScroll(seconds) {
    const end = Date.now() + seconds * 1000;

    while (Date.now() < end) {
      const scroll = random(200, 600);

      await this.driver.executeScript(`window.scrollBy(0, ${scroll})`);

      await sleep(random(1000, 2500));

      if (Math.random() > 0.7) {
        await this.driver.executeScript(`window.scrollBy(0, -${scroll / 2})`);
      }
    }
  }

  async simulateMouse() {
    const x = random(100, 800);
    const y = random(100, 600);

    await this.driver.actions().move({ x, y }).perform();
  }

  async surfAdsLoop() {
    const mainTab = await this.driver.getWindowHandle();

    let refreshed = false;
    let completedAds = 0;

    while (true) {
      try {
        const ads = await this.driver.findElements(
          By.css(".ags-list-box:not(.gray-all):not(.completed)"),
        );

        console.log("Total ads:", ads.length);

        const availableAds = [];

        for (let i = 0; i < ads.length; i++) {
          const box = ads[i];
          const adId = "ad-" + i;

          try {
            let clickable;

            try {
              clickable = await box.findElement(By.css("a"));
            } catch {
              clickable = await box.findElement(By.css("span"));
            }

            // chỉ skip nếu đã click trước đó
            if (attemptedAds.has(adId)) {
              console.log("Skip attempted ad:", adId);

              continue;
            }

            if (blockedAds.includes(adId)) {
              console.log("Skip blocked ad:", adId);

              continue;
            }

            availableAds.push({
              box,
              clickable,
              adId,
            });
          } catch (err) {
            console.log("Ad parse error:", err.message);
          }
        }

        console.log("Available ads:", availableAds.length);

        if (availableAds.length === 0) {
          if (!refreshed) {
            console.log("No ads → refresh once");

            refreshed = true;

            await this.driver.navigate().refresh();

            await sleep(8000);

            continue;
          }

          console.log("Still no ads → finish account");

          fs.writeFileSync("blockedAds.json", JSON.stringify([], null, 2));

          blockedAds = [];

          return {
            status: "DONE",
            completed: completedAds,
          };
        }

        refreshed = false;

        for (const ad of availableAds) {
          const box = ad.box;
          const clickable = ad.clickable;
          const adId = ad.adId;

          try {
            console.log("-----------");
            console.log("Ad detected:", adId);

            const timeElement = await box.findElement(
              By.css(".ags-detail-time span"),
            );

            const seconds = parseInt(await timeElement.getText());

            console.log("Ad duration:", seconds);

            await this.driver.executeScript(
              "arguments[0].scrollIntoView({block:'center'})",
              box,
            );

            await sleep(random(1500, 2500));

            await this.simulateMouse();

            const oldTabs = await this.driver.getAllWindowHandles();
            attemptedAds.add(adId);
            console.log("Click advertisement");

            await clickable.click();

            await sleep(4000);

            let tabs = await this.driver.getAllWindowHandles();

            if (tabs.length === oldTabs.length) {
              console.log("Retry JS click");

              await this.driver.executeScript(
                "arguments[0].click();",
                clickable,
              );

              await sleep(4000);

              tabs = await this.driver.getAllWindowHandles();
            }

            if (tabs.length === oldTabs.length) {
              console.log("Ad did not open");
              continue;
            }

            const newTab = tabs.find((t) => !oldTabs.includes(t));

            if (!newTab) {
              console.log("No new tab detected");
              continue;
            }

            await this.driver.switchTo().window(newTab);

            console.log("Ad page:", await this.driver.getCurrentUrl());

            const pageText = await this.driver
              .findElement(By.tagName("body"))
              .getText();

            if (
              pageText.includes("already viewed") ||
              pageText.includes("already clicked") ||
              pageText.includes("same IP")
            ) {
              console.log("Ad blocked by IP:", adId);

              blockedAds.push(adId);

              fs.writeFileSync(
                "blockedAds.json",
                JSON.stringify(blockedAds, null, 2),
              );

              await this.driver.close();
              await this.driver.switchTo().window(mainTab);

              continue;
            }

            await sleep(3000);

            await this.simulateHumanScroll(seconds + 2);

            console.log("Closing ad tab");

            await this.driver.close();
            await this.driver.switchTo().window(mainTab);

            completedAds++;

            const delay = random(4000, 8000);

            console.log("Human delay:", delay);

            await sleep(delay);
          } catch (err) {
            console.log("Skip ad:", err.message);

            await this.driver.switchTo().window(mainTab);
          }
        }
      } catch (err) {
        console.log("Loop error:", err.message);
      }

      console.log("Refreshing ads");

      await this.driver.navigate().refresh();

      await sleep(10000);
    }
  }
}

module.exports = SurfService;
