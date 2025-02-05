// /lib/coinbaseCommerce.js
async function createCoinbaseCharge(telegramChatId, plan) {
    const url = 'https://api.commerce.coinbase.com/charges';
    const chargeData = {
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
            'Accept': 'application/json'
        },
        body: JSON.stringify({ charge: chargeData })
    });

    const data = await response.json();
    console.error('PAyment error:', data);
    return data;
}

module.exports = { createCoinbaseCharge };
