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
        console.log('Moralis webhook received (truncated logging)...');

        // Only process confirmed transactions
        if (body.confirmed === false) {
            console.log('Transaction not confirmed');
            return res.status(200).json({ message: 'Handled Moralis webhook' });
        }

        // 1. Process each ERC20 transfer from the webhook
        const erc20Transfers = body.erc20Transfers || [];
        // We'll build an array of notification objects
        const notifications = [];

        for (const transfer of erc20Transfers) {
            // Normalize addresses to lowercase for consistent comparisons
            const fromAddr = transfer.from?.toLowerCase();
            const toAddr = transfer.to?.toLowerCase();
            const tokenName = transfer.tokenName || 'Unknown Token';
            const tokenSymbol = transfer.tokenSymbol || '???';
            const txHash = transfer.transactionHash;
            const value = transfer.valueWithDecimals || transfer.value || '???';
            // Normalize triggered_by array if present
            const triggeredBy = transfer.triggered_by
                ? transfer.triggered_by.map(addr => addr.toLowerCase())
                : null;

            // Build a message including a link to Etherscan
            const etherscanLink = `https://etherscan.io/tx/${txHash}`;
            const msg = `ERC20 Transfer
Token: ${tokenName} (${tokenSymbol})
Amount: ${value}
From: ${fromAddr}
To: ${toAddr}
Tx: ${etherscanLink}`;

            // Only add a notification for an address if either:
            // • The transfer has no triggered_by info
            // • OR the triggered_by array includes that address.
            if (fromAddr && (!triggeredBy || triggeredBy.includes(fromAddr))) {
                notifications.push({ notifyAddress: fromAddr, msg });
            }
            if (toAddr && toAddr !== fromAddr && (!triggeredBy || triggeredBy.includes(toAddr))) {
                notifications.push({ notifyAddress: toAddr, msg });
            }
        }

        // 2. For each notification, look up watchers and send them the message
        for (const notification of notifications) {
            await notifyWatchers(notification.notifyAddress, notification.msg);
        }

        // 3. Respond OK
        return res.status(200).json({ message: 'Handled Moralis webhook' });
    } catch (err) {
        console.error('Error in Moralis webhook:', err);
        await sendTelegramMessage(540209384, err.toString());
        return res.status(500).json({ error: 'Server error' });
    }
};

// Helper to look up watchers (from the "wallets" table) and send them a Telegram message
async function notifyWatchers(address, msg) {
    // Use case-insensitive matching (ilike) to look up the wallet address
    const { data: wallets, error } = await supabase
        .from('wallets')
        .select('*')
        .ilike('wallet_address', address);

    if (error) {
        console.error('Supabase error:', error);
        return;
    }

    if (wallets && wallets.length > 0) {
        for (const w of wallets) {
            const chatId = w.telegram_chat_id;
            await sendTelegramMessage(chatId, msg);
        }
    }
}

// Telegram message helper
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

    const data = await resp.json();
    return data;
}
