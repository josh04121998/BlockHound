// pages/api/solana-webhook.js

const { createClient } = require('@supabase/supabase-js');
const { sendTelegramMessage } = require('./lib/telegram');
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
New Solana Event

Description: ${description}

Timestamp: ${formattedTimestamp}

Solscan Link: ${solscanUrl}

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
            if (t.fromUserAccount) addresses.add(t.fromUserAccount);
            if (t.toUserAccount) addresses.add(t.toUserAccount);
        }
    }
    // Check root-level tokenTransfers
    if (evt?.tokenTransfers) {
        for (const t of evt.tokenTransfers) {
            if (t.fromUserAccount) addresses.add(t.fromUserAccount);
            if (t.toUserAccount) addresses.add(t.toUserAccount);
        }
    }
    // Also check nativeTransfers (if you want to notify on SOL movements)
    if (evt?.nativeTransfers) {
        for (const nt of evt.nativeTransfers) {
            if (nt.fromUserAccount) addresses.add(nt.fromUserAccount);
            if (nt.toUserAccount) addresses.add(nt.toUserAccount);
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
    console.log("Checked Supabase, watchers returned:", JSON.stringify(watchers, null, 2));
    if (error) {
        console.error('Supabase error:', error);
        return;
    }

    if (watchers && watchers.length > 0) {
        for (const w of watchers) {
            const chatId = w.telegram_chat_id;
            const result = await sendTelegramMessage(chatId, msg);
            console.log("Telegram send result:", JSON.stringify(result, null, 2));
        }
    }
}
