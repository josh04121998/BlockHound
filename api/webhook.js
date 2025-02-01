// pages/api/moralis-webhook.js

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// We'll reuse the same helper to send Telegram messages
// or define a new one.

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const body = req.body;
        console.log('Moralis webhook received:', body);

        // Suppose Moralis sends the address that triggered the event in body.address
        // Adjust according to your actual Moralis webhook payload structure.
        const triggeredAddress = body.address?.toLowerCase();

        if (!triggeredAddress) {
            return res.status(400).json({ error: 'No address found in payload' });
        }

        // 1. Find all Telegram chat IDs tracking this address
        const { data: wallets, error } = await supabase
            .from('wallets')
            .select('*')
            .ilike('wallet_address', triggeredAddress); // or .eq('wallet_address', triggeredAddress)

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Database error' });
        }

        // 2. Notify each user
        if (wallets && wallets.length > 0) {
            for (const w of wallets) {
                const chatId = w.telegram_chat_id;
                await sendTelegramMessage(
                    chatId,
                    `New on-chain event for your tracked address: ${triggeredAddress}\nDetails: ${JSON.stringify(body)}`
                );
            }
        }

        // 3. Return success
        return res.status(200).json({ message: 'Handled webhook' });
    } catch (err) {
        console.error('Error in Moralis webhook:', err);
        return res.status(500).json({ error: 'Server error' });
    }
}

// Reuse the same sendTelegramMessage as in telegram.js or define again
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
