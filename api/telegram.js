// pages/api/telegram.js

import { createClient } from '@supabase/supabase-js';
const initializeMoralis = require("./initializeMoralis");

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URLL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const Moralis = await initializeMoralis();

// We won't use node-telegram-bot-api in "polling" mode, 
// because serverless can't keep it running. Instead, we 
// parse the webhook updates ourselves.
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // The incoming Telegram update will be in req.body
        const update = req.body;

        // Telegram sends different kinds of updates (message, callbackQuery, etc.)
        // We'll handle the simplest case: a text message
        if (update.message) {
            const chatId = update.message.chat.id;
            const text = update.message.text;

            // Basic command handling
            if (text.startsWith('/start')) {
                // Send a "Welcome" message
                await sendTelegramMessage(chatId, 'Welcome! Use /track <wallet> to track a wallet.');
            } else if (text.startsWith('/track')) {
                // e.g. "/track 0xABC123..."
                const parts = text.split(' ');
                if (parts.length < 2) {
                    await sendTelegramMessage(chatId, 'Usage: /track <wallet_address>');
                } else {
                    const walletAddress = parts[1];
                    // 1. Save to Supabase
                    await supabase.from('wallets').insert([
                        { telegram_chat_id: chatId, wallet_address: walletAddress }
                    ]);

                    // 2. (Optional) Add to Moralis Stream right away
                    // e.g., you can do that here or in a separate route.
                    // await addWalletToMoralisStream(walletAddress);
                    const response = await Moralis.Streams.addAddress({
                        id: "470d004e-187c-4f9b-9366-61282d9aeb28", // stream ID from the previous snippet,
                        address: [walletAddress],
                    });
                    // 3. Acknowledge
                    await sendTelegramMessage(chatId, `Wallet ${walletAddress} is now being tracked!`);
                }
            } else {
                // Echo back or help message
                await sendTelegramMessage(chatId, 'Try /track <wallet_address>');
            }
        }

        // Must respond 200 so Telegram knows we handled it
        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('Telegram webhook error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
}

/**
 * Helper to send messages via Telegram
 */
async function sendTelegramMessage(chatId, message) {
    const token = process.env.TG_TOKEN;
    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: message
        })
    });
    return resp.json();
}
