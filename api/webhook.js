// pages/api/moralis-webhook.js

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Trigger address constant (stays hardcoded for now unless you want it in .env too)
const TRIGGER_ADDRESS = '0xe14767042159e5bd2bf16f81a0fe387ab153fbb4';

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
        const notifications = [];

        for (const transfer of erc20Transfers) {
            const fromAddr = transfer.from;
            const toAddr = transfer.to;
            const tokenName = transfer.tokenName || 'Unknown Token';
            const tokenSymbol = transfer.tokenSymbol || '???';
            const txHash = transfer.transactionHash;
            const value = transfer.valueWithDecimals || transfer.value || '???';
            const triggeredByNormalized = transfer.triggered_by
                ? transfer.triggered_by.map(addr => addr)
                : null;

            const etherscanLink = `https://etherscan.io/tx/${txHash}`;
            const msg = `New ERC20 Event\nToken: ${tokenName} (${tokenSymbol})\nAmount: ${value}\nFrom: ${fromAddr}\nTo: ${toAddr}\nTx: ${etherscanLink}`;

            if (fromAddr) {
                notifications.push({ notifyAddress: fromAddr, msg, triggeredBy: triggeredByNormalized });
            }
            if (toAddr && toAddr !== fromAddr) {
                notifications.push({ notifyAddress: toAddr, msg, triggeredBy: triggeredByNormalized });
            }
        }

        // 2. For each notification, look up watchers and send messages
        for (const notification of notifications) {
            await notifyWatchers(notification.notifyAddress, notification.msg, notification.triggeredBy);
        }

        // 3. Respond OK
        return res.status(200).json({ message: 'Handled Moralis webhook' });
    } catch (err) {
        console.error('Error in Moralis webhook:', err);
        await sendTelegramMessage(540209384, err.toString());
        return res.status(500).json({ error: 'Server error' });
    }
};

// Helper to notify watchers and send to Discord if triggered_by matches
async function notifyWatchers(address, msg, triggeredBy) {
    // Supabase lookup for Telegram watchers
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
            if (triggeredBy && !triggeredBy.includes(address)) {
                console.log(`Skipping notification for ${address} because it is not in triggered_by`);
                continue;
            }
            await sendTelegramMessage(chatId, msg);
            // Discord webhook for specific triggered_by address
            if (triggeredBy && triggeredBy.includes(TRIGGER_ADDRESS)) {
                console.log(`Sending to Discord: Triggered by ${TRIGGER_ADDRESS}`);
                await sendDiscordMessage(msg);
            }
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

// Discord message helper
async function sendDiscordMessage(message) {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) {
        console.error('DISCORD_WEBHOOK_URL not set in environment variables');
        return;
    }

    const resp = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            content: message,
        }),
    });

    if (!resp.ok) {
        console.error('Discord webhook error:', await resp.text());
    }
    return resp.ok;
}