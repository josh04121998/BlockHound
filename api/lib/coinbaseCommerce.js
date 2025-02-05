// /lib/coinbaseCommerce.js
const fetch = require('node-fetch');

async function createCoinbaseCharge(telegramChatId, plan) {
    const url = 'https://api.commerce.coinbase.com/charges';
    const chargeData = {
        name: "Subscription Basic",
        description: `Purchase the Basic subscription ($0.99) for extra address tracking.`,
        local_price: {
            amount: "0.99",
            currency: "USD"
        },
        pricing_type: "fixed_price",
        metadata: {
            telegram_chat_id: telegramChatId,
            plan: plan,
        }
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CC-Api-Key': process.env.COINBASE_COMMERCE_API_KEY,
            'X-CC-Version': '2018-03-22'
        },
        body: JSON.stringify({ charge: chargeData })
    });

    const data = await response.json();
    return data;
}

module.exports = { createCoinbaseCharge };
