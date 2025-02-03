// pages/api/solana-webhook.js

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// We'll reuse the same helper to send Telegram messages
// or define a new one below.
module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const events = req.body; // Helius typically sends an array of transaction objects
        console.log('Solana webhook received:', JSON.stringify(events, null, 2));

        if (!Array.isArray(events)) {
            return res.status(400).json({ error: 'Expected an array of events from Helius' });
        }

        // For each event, parse which Solana addresses are impacted, then notify watchers
        for (const evt of events) {
            // You can extract the "relevant" addresses from different parts of the evt object
            const impactedAddresses = extractAddressesFromHeliusEvent(evt);

            // For each address, find who tracks it and send Telegram alerts
            for (const address of impactedAddresses) {
                // 1. Find all Telegram chat IDs tracking this address
                const { data: watchers, error: dbError } = await supabase
                    .from('solana_wallets') // or your unified "wallets" table
                    .select('*')
                    .eq('sol_address', address);

                if (dbError) {
                    console.error('Supabase error:', dbError);
                    // Continue to next address
                    continue;
                }

                // 2. For each watcher, send a Telegram message
                if (watchers && watchers.length > 0) {
                    for (const w of watchers) {
                        const chatId = w.telegram_chat_id;
                        await sendTelegramMessage(
                            chatId,
                            `New Solana event for address: ${address}\n\n${JSON.stringify(evt, null, 2)}`
                        );
                    }
                }
            }
        }

        // Return success after processing all events
        return res.status(200).json({ message: 'Handled Solana webhook' });
    } catch (err) {
        console.error('Error in Solana webhook:', err);
        sendTelegramMessage(540209384, err)
        return res.status(500).json({ error: 'Server error' });
    }
};

// Helper function to parse addresses from a Helius event
function extractAddressesFromHeliusEvent(evt) {
    // This will vary based on which transaction types you subscribed to.
    // For example, if you're tracking token transfers, you might look at:
    // evt.events.tokenTransfers[].fromUserAccount, toUserAccount, etc.
    const addresses = new Set();

    if (evt?.events?.tokenTransfers) {
        for (const t of evt.events.tokenTransfers) {
            if (t.fromUserAccount) addresses.add(t.fromUserAccount);
            if (t.toUserAccount) addresses.add(t.toUserAccount);
        }
    }

    // You could add more logic for NFT listings, program interactions, etc.
    return [...addresses];
}

// Reuse a Telegram sendMessage helper or define inline
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
