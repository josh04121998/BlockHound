// pages/api/telegram.js

const { createClient } = require('@supabase/supabase-js');
const initializeMoralis = require("./initializeMoralis"); // Adjust path as needed

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URLL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // 1. Initialize Moralis on each request (internally it's a one-time init)
        const Moralis = await initializeMoralis();

        // 2. Handle Telegram webhook
        const update = req.body;
        if (update.message) {
            const chatId = update.message.chat.id;
            const text = update.message.text;

            if (text.startsWith('/start')) {
                await sendTelegramMessage(chatId, 'Welcome! Use /track <wallet> to track a wallet.');
            } else if (text.startsWith('/track')) {
                const parts = text.split(' ');
                if (parts.length < 2) {
                    await sendTelegramMessage(chatId, 'Usage: /track <wallet_address>');
                } else {
                    const walletAddress = parts[1];

                    // 1. Save to Supabase
                    await supabase.from('wallets').insert([
                        { telegram_chat_id: chatId, wallet_address: walletAddress }
                    ]);

                    // 2. Add to Moralis Stream
                    await Moralis.Streams.addAddress({
                        id: "470d004e-187c-4f9b-9366-61282d9aeb28", // Your stream ID
                        address: [walletAddress],
                    });

                    // 3. Acknowledge
                    await sendTelegramMessage(chatId, `Wallet ${walletAddress} is now being tracked!`);
                }
            } else {
                await sendTelegramMessage(chatId, 'Try /track <wallet_address>');
            }
        }

        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('Telegram webhook error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
}

async function sendTelegramMessage(chatId, message) {
    const token = process.env.TG_TOKEN;
    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: message,
        }),
    });

    return resp.json();
}
