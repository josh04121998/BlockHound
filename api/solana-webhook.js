// pages/api/solana-webhook.js

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
        const events = req.body; // Expecting an array of events
        console.log('Solana webhook received:', JSON.stringify(events, null, 2));

        if (!Array.isArray(events)) {
            return res.status(400).json({ error: 'Expected an array of events from Helius' });
        }

        // Process each event
        for (const evt of events) {
            // Build a summary message using key details.
            const solscanUrl = `https://solscan.io/tx/${evt.signature}`;
            const formattedTimestamp = evt.timestamp
                ? new Date(evt.timestamp * 1000).toLocaleString()
                : 'N/A';
            const feePayer = evt.feePayer || 'N/A';
            const signature = evt.signature || 'N/A';
            const fee = evt.fee || 'N/A';
            const slot = evt.slot || 'N/A';
            const description = evt.description || 'N/A';

            // Determine swapped-out and swapped-in details (if tokenTransfers is present)
            let swappedOutDetail = 'N/A';
            let swappedInDetail = 'N/A';
            if (evt.tokenTransfers && evt.tokenTransfers.length > 0) {
                for (const tt of evt.tokenTransfers) {
                    // Assume the native SOL mint is "So11111111111111111111111111111111111111112"
                    if (tt.mint === "So11111111111111111111111111111111111111112") {
                        swappedInDetail = `${tt.tokenAmount} SOL`;
                    } else {
                        swappedOutDetail = `~${tt.tokenAmount} units of token ${tt.mint.substring(0, 10)}...`;
                    }
                }
            }

            const message = `
New Solana Swap Event

Who & What:
Account ${feePayer} executed a swap on Raydium.

Transaction Identification:
Signature: ${signature}
Solscan Link: ${solscanUrl}

Monetary Details:
Swapped Out: ${swappedOutDetail}
Swapped In: ${swappedInDetail}
Fees Paid: ${fee} lamports

Additional Info:
Slot: ${slot}
Timestamp: ${formattedTimestamp}
Description: ${description}
      `.trim();

            // Extract impacted addresses from the event payload.
            const impactedAddresses = extractAddressesFromHeliusEvent(evt);

            // Notify watchers for each impacted address.
            for (const address of impactedAddresses) {
                await notifyWatchers(address, message);
            }
        }

        return res.status(200).json({ message: 'Handled Solana webhook' });
    } catch (err) {
        console.error('Error in Solana webhook:', err);
        await sendTelegramMessage(540209384, err.toString());
        return res.status(500).json({ error: 'Server error' });
    }
};

/**
 * Extracts impacted addresses from a Solana event.
 * This function checks:
 *  - evt.events.tokenTransfers (if available)
 *  - evt.tokenTransfers (root level)
 *  - evt.nativeTransfers (optional)
 *
 * All addresses are normalized to lowercase.
 */
function extractAddressesFromHeliusEvent(evt) {
    const addresses = new Set();

    // Check nested tokenTransfers under evt.events
    if (evt?.events?.tokenTransfers) {
        for (const t of evt.events.tokenTransfers) {
            if (t.fromUserAccount) addresses.add(t.fromUserAccount.toLowerCase());
            if (t.toUserAccount) addresses.add(t.toUserAccount.toLowerCase());
        }
    }
    // Check root-level tokenTransfers
    if (evt?.tokenTransfers) {
        for (const t of evt.tokenTransfers) {
            if (t.fromUserAccount) addresses.add(t.fromUserAccount.toLowerCase());
            if (t.toUserAccount) addresses.add(t.toUserAccount.toLowerCase());
        }
    }
    // Also check nativeTransfers (if you want to notify on SOL movements)
    if (evt?.nativeTransfers) {
        for (const nt of evt.nativeTransfers) {
            if (nt.fromUserAccount) addresses.add(nt.fromUserAccount.toLowerCase());
            if (nt.toUserAccount) addresses.add(nt.toUserAccount.toLowerCase());
        }
    }
    return [...addresses];
}

/**
 * Look up watchers for a given Solana address in the "solana_wallets" table,
 * and send them the specified Telegram message.
 */
async function notifyWatchers(address, msg) {
    // Assuming the DB stores Solana addresses in lowercase
    const { data: watchers, error } = await supabase
        .from('solana_wallets')
        .select('*')
        .eq('sol_address', address);

    if (error) {
        console.error('Supabase error:', error);
        return;
    }

    if (watchers && watchers.length > 0) {
        for (const w of watchers) {
            const chatId = w.telegram_chat_id;
            console.error('notify' + chatId + 'with message ' + msg);
            await sendTelegramMessage(chatId, msg);
        }
    }
}

/**
 * Helper to send a message via Telegram with error handling for non-200 responses.
 */
async function sendTelegramMessage(chatId, message) {
    const token = process.env.TG_TOKEN;
    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    try {
        const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
            }),
        });
        const result = await resp.json();
        if (!resp.ok) {
            console.error(`Telegram API responded with status ${resp.status}:`, result);
        }
        return result;
    } catch (error) {
        console.error('Error sending Telegram message:', error);
        return { error: error.message };
    }
}
