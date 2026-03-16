const axios = require("axios");

const BOT_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function sendTelegram(message) {

    try {

        await axios.post(
            `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
            {
                chat_id: CHAT_ID,
                text: message
            }
        );

    } catch (err) {

        console.log("Telegram error:", err.message);
    }

}

module.exports = sendTelegram;