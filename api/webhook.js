// pages/api/moralis-webhook.js

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const body = req.body;
        console.log('Moralis webhook received:', JSON.stringify(body, null, 2));

        // 1. Check for ERC20 Transfers (or logs, NFT transfers, etc., as needed)
        const erc20Transfers = body.erc20Transfers || [];

        // We'll collect addresses from these transfers in a Set to avoid duplicates
        const impactedAddresses = new Set();

        // For each transfer, add the "from" and "to" addresses (if present)
        for (const transfer of erc20Transfers) {
            if (transfer.from) impactedAddresses.add(transfer.from.toLowerCase());
            if (transfer.to) impactedAddresses.add(transfer.to.toLowerCase());
        }

        console.log('impacted addy:', JSON.stringify(impactedAddresses));
        // 2. For each impacted address, find which Telegram users are tracking it
        for (const address of impactedAddresses) {
            // Query your "wallets" table to see who tracks this address
            const { data: wallets, error } = await supabase
                .from('wallets')
                .select('*')
                .ilike('wallet_address', address); // or eq if your DB stores it exactly

            if (error) {
                console.error('Supabase error:', error);
                // We won't fail the entire webhook if one query fails; just continue
                continue;
            }
            console.log('wallets:', JSON.stringify(wallets));
            // If there are watchers, notify them
            if (wallets && wallets.length > 0) {
                for (const w of wallets) {
                    const chatId = w.telegram_chat_id;
                    console.log('Sending message to chat:', chatId);
                    const resp = await sendTelegramMessage(
                        chatId,
                        `New on-chain event for your tracked address: ${address}\nDetails: ${JSON.stringify(body.erc20Transfers)}`
                    );
                    console.log('Telegram response:', resp);
                }
            }
        }

        // 3. Respond success
        return res.status(200).json({ message: 'Handled webhook' });
    } catch (err) {
        console.error('Error in Moralis webhook:', err);
        return res.status(500).json({ error: 'Server error' });
    }
};

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