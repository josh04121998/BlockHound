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
        if (body.confirmed == false) {
            console.log('Transaction not confirmed');
            return res.status(200).json({ message: 'Handled Moralis webhook' });
        }
        // If you want to see the entire JSON, do: console.log(JSON.stringify(body, null, 2));

        // 1. Collect impacted addresses from ERC20 transfers
        const erc20Transfers = body.erc20Transfers || [];
        // We'll store each transfer's relevant info for alerts in an array
        const transfersData = [];

        for (const transfer of erc20Transfers) {
            const fromAddr = transfer.from?.toLowerCase();
            const toAddr = transfer.to?.toLowerCase();
            const tokenName = transfer.tokenName || 'Unknown Token';
            const tokenSymbol = transfer.tokenSymbol || '???';
            const txHash = transfer.transactionHash;
            const value = transfer.valueWithDecimals || transfer.value || '???';

            // Prepare a tidy message
            const etherscanLink = `https://etherscan.io/tx/${txHash}`;
            const msg = `ERC20 Transfer\nToken: ${tokenName} (${tokenSymbol})\nAmount: ${value}\nFrom: ${fromAddr}\nTo: ${toAddr}\nTx: ${etherscanLink}`;

            // Save this item so we can notify watchers of "from" and watchers of "to"
            transfersData.push({
                fromAddr,
                toAddr,
                msg, // the formatted message
            });
        }

        // 2. For each transfer item, notify watchers of "fromAddr" + watchers of "toAddr"
        for (const t of transfersData) {
            // Notify watchers of 'fromAddr'
            if (t.fromAddr) {
                await notifyWatchers(t.fromAddr, t.msg);
            }

            // Notify watchers of 'toAddr', skip if it's the same as fromAddr
            if (t.toAddr && t.toAddr !== t.fromAddr) {
                await notifyWatchers(t.toAddr, t.msg);
            }
        }

        // 3. Respond OK
        return res.status(200).json({ message: 'Handled Moralis webhook' });
    } catch (err) {
        console.error('Error in Moralis webhook:', err);
        sendTelegramMessage(540209384, err)
        return res.status(500).json({ error: 'Server error' });
    }
};

// Helper to find watchers of a specific address & send them the message
async function notifyWatchers(address, msg) {
    // 1. Look up in "wallets" table
    // If your DB stores addresses in uppercase or exactly as user entered,
    // you might need .eq('wallet_address', address) or .ilike for partial matches
    const { data: wallets, error } = await supabase
        .from('wallets')
        .select('*')
        .ilike('wallet_address', address);

    if (error) {
        console.error('Supabase error:', error);
        return;
    }

    // 2. If watchers exist, send them Telegram messages
    if (wallets && wallets.length > 0) {
        for (const w of wallets) {
            const chatId = w.telegram_chat_id;
            // We do one message per user
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
    // You can log data if you need to debug Telegram's response
    return data;
}
