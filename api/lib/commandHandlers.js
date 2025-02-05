// /lib/commandHandlers.js
const supabase = require('./supabaseClient');
const { sendTelegramMessage } = require('./telegram');
const { isValidEthAddress, isValidSolAddress } = require('./validators');
const initializeMoralis = require('../initializeMoralis');
const { trackSolanaAddress, untrackSolanaAddress } = require('../solanaWebhookManager');

async function handleStart(chatId) {
    const message = [
        'Welcome! Commands:',
        '/track <eth_wallet> – Track an Ethereum address',
        '/untrack <eth_wallet> – Untrack an Ethereum address',
        '/tracksol <sol_address> – Track a Solana address',
        '/untracksol <sol_address> – Untrack a Solana address'
    ].join('\n');
    await sendTelegramMessage(chatId, message);
}

async function handleTrackSol(chatId, solAddress) {
    if (!isValidSolAddress(solAddress)) {
        await sendTelegramMessage(chatId, 'Invalid Solana address.');
        return;
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
        await sendTelegramMessage(540209384, err.toString());
        await sendTelegramMessage(chatId, 'Failed to track Solana address. Please try again.');
    }
}

async function handleUntrackSol(chatId, solAddress) {
    if (!isValidSolAddress(solAddress)) {
        await sendTelegramMessage(chatId, 'Invalid Solana address.');
        return;
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

async function handleTrackEth(chatId, walletAddress) {
    if (!isValidEthAddress(walletAddress)) {
        await sendTelegramMessage(chatId, 'Invalid Ethereum address.');
        return;
    }

    // Check if user already tracks this address.
    const { data: existingRecords, error: selectError } = await supabase
        .from('wallets')
        .select('*')
        .eq('telegram_chat_id', chatId)
        .eq('wallet_address', walletAddress);

    if (selectError) {
        console.error('Select error:', selectError);
        await sendTelegramMessage(chatId, 'Database error. Please try again later.');
        return;
    }

    if (existingRecords && existingRecords.length > 0) {
        await sendTelegramMessage(chatId, `You are already tracking wallet ${walletAddress}.`);
        return;
    }

    // Insert into Supabase.
    const { error: insertError } = await supabase
        .from('wallets')
        .insert([{ telegram_chat_id: chatId, wallet_address: walletAddress }]);

    if (insertError) {
        console.error('Insert error:', insertError);
        await sendTelegramMessage(chatId, 'Error saving address. Please try again.');
        return;
    }

    // Add to Moralis stream.
    try {
        const Moralis = await initializeMoralis();
        await Moralis.Streams.addAddress({
            id: '470d004e-187c-4f9b-9366-61282d9aeb28', // Your stream ID
            address: [walletAddress],
        });
    } catch (moralisError) {
        console.error('Moralis error adding address:', moralisError);
        await supabase
            .from('wallets')
            .delete()
            .match({ telegram_chat_id: chatId, wallet_address: walletAddress });
        await sendTelegramMessage(chatId, 'Error adding to Moralis stream. Please try again later.');
        await sendTelegramMessage(540209384, moralisError.toString());
        return;
    }

    await sendTelegramMessage(chatId, `Wallet ${walletAddress} is now being tracked!`);
}

async function handleUntrackEth(chatId, walletAddress) {
    if (!isValidEthAddress(walletAddress)) {
        await sendTelegramMessage(chatId, 'Invalid Ethereum address.');
        return;
    }

    const { data: existingRecords, error: selectError } = await supabase
        .from('wallets')
        .select('*')
        .eq('telegram_chat_id', chatId)
        .eq('wallet_address', walletAddress);

    if (selectError) {
        console.error('Select error:', selectError);
        await sendTelegramMessage(chatId, 'Database error. Please try again later.');
        return;
    }

    if (!existingRecords || existingRecords.length === 0) {
        await sendTelegramMessage(chatId, `You are not tracking ${walletAddress}. Nothing to untrack.`);
        return;
    }

    const { error: deleteError } = await supabase
        .from('wallets')
        .delete()
        .match({ telegram_chat_id: chatId, wallet_address: walletAddress });

    if (deleteError) {
        console.error('Delete error:', deleteError);
        await sendTelegramMessage(chatId, 'Error removing address. Please try again.');
        return;
    }

    await sendTelegramMessage(chatId, `Wallet ${walletAddress} was removed from tracking.`);
}

async function handleUnknownCommand(chatId) {
    await sendTelegramMessage(
        chatId,
        'Unknown command. Try /start, /track, /untrack, /tracksol, or /untracksol.'
    );
}

module.exports = {
    handleStart,
    handleTrackSol,
    handleUntrackSol,
    handleTrackEth,
    handleUntrackEth,
    handleUnknownCommand,
};
