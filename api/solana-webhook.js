// pages/api/solana-webhook.js

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch'); // Ensure you have node-fetch installed

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
        const events = req.body; // Helius typically sends an array of transaction objects
        console.log('Solana webhook received:', JSON.stringify(events, null, 2));

        if (!Array.isArray(events)) {
            return res.status(400).json({ error: 'Expected an array of events from Helius' });
        }

        // Process each event in the payload
        for (const evt of events) {
            // Basic extraction of details
            const feePayer = evt.feePayer || 'N/A';
            const signature = evt.signature || 'N/A';
            const solscanUrl = `https://solscan.io/tx/${signature}`;
            const slot = evt.slot || 'N/A';
            const formattedTimestamp = evt.timestamp
                ? new Date(evt.timestamp * 1000).toLocaleString()
                : 'N/A';

            // Extract swap details from tokenTransfers:
            // Assume the non-SOL token is the swapped-out asset.
            let swappedOutTransfer = null;
            let swappedInTransfer = null;
            if (evt.tokenTransfers && evt.tokenTransfers.length > 0) {
                for (const tt of evt.tokenTransfers) {
                    if (tt.mint === "So11111111111111111111111111111111111111112") {
                        swappedInTransfer = tt;
                    } else {
                        swappedOutTransfer = tt;
                    }
                }
            }

            const swappedOutAmount = swappedOutTransfer
                ? Number(swappedOutTransfer.tokenAmount).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })
                : 'N/A';
            const tokenMint = swappedOutTransfer ? swappedOutTransfer.mint : 'N/A';
            const truncatedMint =
                tokenMint !== 'N/A'
                    ? `${tokenMint.substring(0, 10)}...${tokenMint.substring(tokenMint.length - 4)}`
                    : 'N/A';
            const swappedInAmount = swappedInTransfer
                ? Number(swappedInTransfer.tokenAmount).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })
                : 'N/A';
            const feePaid = evt.fee ? Number(evt.fee).toLocaleString() : 'N/A';

            // Build the summary message using only the key information
            const message = `
New Solana Swap Event

Who & What:
Account ${feePayer} executed a swap on Raydium, exchanging a large quantity of a specific token for SOL.

Transaction Identification:
Signature: ${signature}
Solscan Link: ${solscanUrl}

Monetary Details:
Swapped Out: ~${swappedOutAmount} units of token ${truncatedMint}
Swapped In: ~${swappedInAmount} SOL
Fees Paid: ${feePaid} lamports

Additional Info:
Multiple native SOL transfers indicate fee distribution and liquidity adjustments.
Recorded in slot ${slot} at ${formattedTimestamp}.
      `.trim();

            // Determine which addresses are impacted (here, using token transfers)
            const impactedAddresses = extractAddressesFromHeliusEvent(evt);

            // For each impacted address, look up watchers and send them the summary message
            for (const address of impactedAddresses) {
                // 1. Find all Telegram chat IDs tracking this address
                const { data: watchers, error: dbError } = await supabase
                    .from('solana_wallets') // Adjust table name if needed
                    .select('*')
                    .eq('sol_address', address);

                if (dbError) {
                    console.error('Supabase error:', dbError);
                    continue;
                }

                // 2. Send the summary message to each watcher via Telegram
                if (watchers && watchers.length > 0) {
                    for (const w of watchers) {
                        const chatId = w.telegram_chat_id;
                        await sendTelegramMessage(chatId, message);
                    }
                }
            }
        }

        return res.status(200).json({ message: 'Handled Solana webhook' });
    } catch (err) {
        console.error('Error in Solana webhook:', err);
        // Optionally, alert an admin Telegram chat (e.g., chat id 540209384)
        sendTelegramMessage(540209384, `Error in Solana webhook:\n\n${err}`);
        return res.status(500).json({ error: 'Server error' });
    }
};

// Helper function to extract impacted addresses from a Helius event
function extractAddressesFromHeliusEvent(evt) {
    const addresses = new Set();

    // Extract from tokenTransfers if present
    if (evt?.events?.tokenTransfers) {
        for (const t of evt.events.tokenTransfers) {
            if (t.fromUserAccount) addresses.add(t.fromUserAccount);
            if (t.toUserAccount) addresses.add(t.toUserAccount);
        }
    }

    return [...addresses];
}

// Telegram sendMessage helper
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
