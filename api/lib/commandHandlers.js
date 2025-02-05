// /lib/commandHandlers.js
const supabase = require('./supabaseClient');
const { sendTelegramMessage } = require('./telegram');
const { isValidEthAddress, isValidSolAddress } = require('./validators');
const { trackSolanaAddress, untrackSolanaAddress } = require('../solanaWebhookManager');
const { createCoinbaseCharge } = require('./coinbaseCommerce');

async function handleStart(chatId) {
    const message = [
        'Welcome! Commands:',
        '/track <eth_wallet> – Track an Ethereum address',
        '/untrack <eth_wallet> – Untrack an Ethereum address',
        '/tracksol <sol_address> – Track a Solana address',
        '/untracksol <sol_address> – Untrack a Solana address',
        '/subscribe basic – Purchase extra address tracking ($0.99)'
    ].join('\n');
    await sendTelegramMessage(chatId, message);
}

async function handleTrackEth(chatId, walletAddress) {
    if (!isValidEthAddress(walletAddress)) {
        await sendTelegramMessage(chatId, 'Invalid Ethereum address.');
        return;
    }

    // Check how many Ethereum addresses the user is tracking.
    const { data: existingRecords, error: selectError } = await supabase
        .from('wallets')
        .select('*')
        .eq('telegram_chat_id', chatId)
        .eq('wallet_type', 'eth');

    if (selectError) {
        console.error('Select error:', selectError);
        await sendTelegramMessage(chatId, 'Database error. Please try again later.');
        return;
    }

    // Free limit is 1 address.
    if (existingRecords && existingRecords.length >= 1) {
        // Check for an active paid subscription for Ethereum.
        const { data: subs, error: subError } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('telegram_chat_id', chatId)
            .eq('plan', 'basic')
            .eq('paid', true);

        if (subError || !subs || subs.length === 0) {
            await sendTelegramMessage(
                chatId,
                'You have reached your free Ethereum address tracking limit. Please subscribe using /subscribe basic to add another.'
            );
            return;
        }
    }

    // (Insert your logic to add the Ethereum address to your DB and any necessary external service.)
    await sendTelegramMessage(chatId, `Wallet ${walletAddress} is now being tracked!`);
}

async function handleTrackSol(chatId, solAddress) {
    if (!isValidSolAddress(solAddress)) {
        await sendTelegramMessage(chatId, 'Invalid Solana address.');
        return;
    }

    // Check how many Solana addresses the user is tracking.
    const { data: existingRecords, error: selectError } = await supabase
        .from('solana_wallets')
        .select('*')
        .eq('telegram_chat_id', chatId);

    if (selectError) {
        console.error('Select error:', selectError);
        await sendTelegramMessage(chatId, 'Database error. Please try again later.');
        return;
    }

    // Free limit is 1 address.
    if (existingRecords && existingRecords.length >= 1) {
        // Check for an active paid subscription for Solana.
        const { data: subs, error: subError } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('telegram_chat_id', chatId)
            .eq('plan', 'basic')
            .eq('paid', true);

        if (subError || !subs || subs.length === 0) {
            await sendTelegramMessage(
                chatId,
                'You have reached your free Solana address tracking limit. Please subscribe using /subscribe basic to add another.'
            );
            return;
        }
    }

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
        console.error('Error in handleTrackSol:', err);
        await sendTelegramMessage(chatId, 'Failed to track Solana address. Please try again.');
    }
}

async function handleSubscribeBasic(chatId) {
    // Create a Coinbase Commerce charge for a subscription.
    try {
        const charge = await createCoinbaseCharge(chatId, 'basic');
        if (charge && charge.data && charge.data.hosted_url) {
            await sendTelegramMessage(
                chatId,
                `Please complete your purchase for the Basic subscription ($0.99) here: ${charge.data.hosted_url}`
            );
        } else {
            await sendTelegramMessage(chatId, 'Error creating the purchase. Please try again later.');
        }
    } catch (err) {
        console.error('Error in handleSubscribeBasic:', err);
        await sendTelegramMessage(chatId, 'Error processing your purchase. Please try again later.');
    }
}

async function handleUntrackEth(chatId, walletAddress) {
    if (!isValidEthAddress(walletAddress)) {
        await sendTelegramMessage(chatId, 'Invalid Ethereum address.');
        return;
    }

    // Delete the Ethereum address record from the "wallets" table.
    const { data, error } = await supabase
        .from('wallets')
        .delete()
        .match({ telegram_chat_id: chatId, wallet_address: walletAddress, wallet_type: 'eth' });

    if (error) {
        console.error('Error removing Ethereum address:', error);
        await sendTelegramMessage(chatId, 'Error removing Ethereum address. Please try again later.');
        return;
    }

    if (!data || data.length === 0) {
        await sendTelegramMessage(chatId, `You are not tracking ${walletAddress}. Nothing to untrack.`);
        return;
    }

    await sendTelegramMessage(chatId, `Wallet ${walletAddress} has been removed from tracking.`);
}

async function handleUntrackSol(chatId, solAddress) {
    if (!isValidSolAddress(solAddress)) {
        await sendTelegramMessage(chatId, 'Invalid Solana address.');
        return;
    }

    const result = await untrackSolanaAddress(chatId, solAddress);
    if (result.success) {
        await sendTelegramMessage(chatId, `Solana address ${solAddress} has been removed from tracking.`);
    } else {
        await sendTelegramMessage(chatId, 'Unknown error tracking address.');
    }

    await sendTelegramMessage(chatId, `Solana address ${solAddress} has been removed from tracking.`);
}

async function handleUnknownCommand(chatId) {
    await sendTelegramMessage(
        chatId,
        'Unknown command. Try /start, /track, /untrack, /tracksol, /untracksol, or /subscribe basic.'
    );
}

module.exports = {
    handleStart,
    handleTrackEth,
    handleTrackSol,
    handleSubscribeBasic,
    handleUntrackEth,
    handleUntrackSol,
    handleUnknownCommand,
    // Include other handlers (such as untrack) as needed.
};
