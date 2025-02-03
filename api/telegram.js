const { createClient } = require('@supabase/supabase-js');
const initializeMoralis = require('./initializeMoralis');
const { trackSolanaAddress } = require('./solanaWebhookManager');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Minimal Ethereum address validation using a regex
function isValidEthAddress(address) {
    // Basic check for "0x" followed by 40 hex chars
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Minimal Solana address validation (Base58 up to 44 chars, can vary)
function isValidSolAddress(address) {
    // A simple check: Solana addresses are typically Base58, length ~32-44
    // This is not bulletproof, but decent for quick validation
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // 1. Initialize Moralis (one-time internally)
        const Moralis = await initializeMoralis();

        // 2. Handle Telegram webhook
        const update = req.body;
        if (update.message) {
            const chatId = update.message.chat.id;
            const text = update.message.text;

            if (text.startsWith('/start')) {
                // Intro message
                await sendTelegramMessage(
                    chatId,
                    'Welcome! Commands:\n' +
                    '/track <eth_wallet> – Track an Ethereum address\n' +
                    '/untrack <eth_wallet> – Untrack an Ethereum address\n' +
                    '/tracksol <sol_address> – Track a Solana address\n' +
                    '/untracksol <sol_address> – Untrack a Solana address'
                );
            }
            else if (text.startsWith('/tracksol ')) {
                const parts = text.split(' ');
                if (parts.length < 2) {
                    await sendTelegramMessage(chatId, 'Usage: /tracksol <sol_address>');
                } else {
                    const solAddress = parts[1];
                    if (!isValidSolAddress(solAddress)) {
                        await sendTelegramMessage(chatId, 'Invalid Solana address.');
                        return res.status(200).json({ ok: true });
                    }

                    // Use the helper
                    try {
                        const result = await trackSolanaAddress(chatId, solAddress);
                        if (result.success) {
                            await sendTelegramMessage(chatId, `Solana address ${solAddress} is now tracked!`);
                        } else if (result.reason === 'already_tracked') {
                            await sendTelegramMessage(chatId, `You are already tracking ${solAddress}.`);
                        } else {
                            await sendTelegramMessage(chatId, 'Unknown error tracking address.');
                        }
                    } catch (err) {
                        console.error('Error trackSolanaAddress:', err);
                        sendTelegramMessage(540209384, (err));
                        await sendTelegramMessage(chatId, 'Failed to track Solana address. Please try again.');
                    }
                }
            }

            // 4. NEW: Untrack Solana
            else if (text.startsWith('/untracksol ')) {
                const parts = text.split(' ');
                if (parts.length < 2) {
                    await sendTelegramMessage(chatId, 'Usage: /untracksol <sol_address>');
                } else {
                    const solAddress = parts[1];
                    if (!isValidSolAddress(solAddress)) {
                        await sendTelegramMessage(chatId, 'Invalid Solana address.');
                        return res.status(200).json({ ok: true });
                    }

                    const result = await untrackSolanaAddress(chatId, solAddress);
                    if (!result.success) {
                        if (result.reason === 'not_tracked') {
                            await sendTelegramMessage(chatId, `You are not tracking ${solAddress}.`);
                        } else {
                            await sendTelegramMessage(chatId, `Error untracking address: ${result.reason}`);
                        }
                    } else {
                        await sendTelegramMessage(chatId, `Solana address ${solAddress} was removed from tracking.`);
                    }
                }
            }
            else if (text.startsWith('/track')) {
                // e.g. "/track 0xABC123..."
                const parts = text.split(' ');
                if (parts.length < 2) {
                    await sendTelegramMessage(chatId, 'Usage: /track <wallet_address>');
                } else {
                    const walletAddress = parts[1];

                    // 1. Validate address
                    if (!isValidEthAddress(walletAddress)) {
                        await sendTelegramMessage(chatId, 'Invalid Ethereum address.');
                        return res.status(200).json({ ok: true });
                    }

                    // 2. Check if user already tracks this address
                    const { data: existingRecords, error: selectError } = await supabase
                        .from('wallets')
                        .select('*')
                        .eq('telegram_chat_id', chatId)
                        .eq('wallet_address', walletAddress);

                    if (selectError) {
                        console.error('Select error:', selectError);
                        await sendTelegramMessage(chatId, 'Database error. Please try again later.');
                        return res.status(200).json({ ok: false });
                    }

                    if (existingRecords && existingRecords.length > 0) {
                        // Already tracked
                        await sendTelegramMessage(
                            chatId,
                            `You are already tracking wallet ${walletAddress}.`
                        );
                        return res.status(200).json({ ok: true });
                    }

                    // 3. Insert into Supabase
                    const { error: insertError } = await supabase
                        .from('wallets')
                        .insert([{ telegram_chat_id: chatId, wallet_address: walletAddress }]);

                    if (insertError) {
                        console.error('Insert error:', insertError);
                        await sendTelegramMessage(chatId, 'Error saving address. Please try again.');
                        return res.status(200).json({ ok: false });
                    }

                    // 4. Add to Moralis stream
                    try {
                        await Moralis.Streams.addAddress({
                            id: '470d004e-187c-4f9b-9366-61282d9aeb28', // Your stream ID
                            address: [walletAddress],
                        });
                    } catch (moralisError) {
                        // If Moralis fails, optionally remove from DB so user isn't stuck
                        console.error('Moralis error adding address:', moralisError);
                        await supabase
                            .from('wallets')
                            .delete()
                            .match({ telegram_chat_id: chatId, wallet_address: walletAddress });
                        await sendTelegramMessage(
                            chatId,
                            'Error adding to Moralis stream. Please try again later.'
                        );
                        sendTelegramMessage(540209384, moralisError)
                        return res.status(200).json({ ok: false });
                    }

                    // 5. Acknowledge
                    await sendTelegramMessage(
                        chatId,
                        `Wallet ${walletAddress} is now being tracked!`
                    );
                }
            } else if (text.startsWith('/untrack')) {
                // e.g. "/untrack 0xABC123..."
                const parts = text.split(' ');
                if (parts.length < 2) {
                    await sendTelegramMessage(chatId, 'Usage: /untrack <wallet_address>');
                } else {
                    const walletAddress = parts[1];

                    // 1. Validate address
                    if (!isValidEthAddress(walletAddress)) {
                        await sendTelegramMessage(chatId, 'Invalid Ethereum address.');
                        return res.status(200).json({ ok: true });
                    }

                    // 2. Check if user actually tracks this address
                    const { data: existingRecords, error: selectError } = await supabase
                        .from('wallets')
                        .select('*')
                        .eq('telegram_chat_id', chatId)
                        .eq('wallet_address', walletAddress);

                    if (selectError) {
                        console.error('Select error:', selectError);
                        await sendTelegramMessage(chatId, 'Database error. Please try again later.');
                        return res.status(200).json({ ok: false });
                    }

                    if (!existingRecords || existingRecords.length === 0) {
                        await sendTelegramMessage(
                            chatId,
                            `You are not tracking ${walletAddress}. Nothing to untrack.`
                        );
                        return res.status(200).json({ ok: true });
                    }

                    // 3. Remove address from Supabase
                    const { error: deleteError } = await supabase
                        .from('wallets')
                        .delete()
                        .match({ telegram_chat_id: chatId, wallet_address: walletAddress });

                    if (deleteError) {
                        console.error('Delete error:', deleteError);
                        await sendTelegramMessage(chatId, 'Error removing address. Please try again.');
                        return res.status(200).json({ ok: false });
                    }

                    // 5. Acknowledge untrack
                    await sendTelegramMessage(
                        chatId,
                        `Wallet ${walletAddress} was removed from tracking.`
                    );
                }
            }


            else {
                // Unrecognized command
                await sendTelegramMessage(
                    chatId,
                    'Unknown command. Try /start, /track, or /untrack.'
                );
            }
        }

        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('Telegram webhook error:', err);
        sendTelegramMessage(540209384, err)
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
