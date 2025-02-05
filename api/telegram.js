// /pages/api/telegramWebhook.js
const { sendTelegramMessage } = require('../../lib/telegram');
const {
    handleStart,
    handleTrackSol,
    handleUntrackSol,
    handleTrackEth,
    handleUntrackEth,
    handleUnknownCommand,
} = require('../../lib/commandHandlers');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const update = req.body;

        if (update.message) {
            const chatId = update.message.chat.id;
            const text = update.message.text || '';

            if (text.startsWith('/start')) {
                await handleStart(chatId);
            } else if (text.startsWith('/tracksol ')) {
                const parts = text.split(' ');
                if (parts.length < 2) {
                    await sendTelegramMessage(chatId, 'Usage: /tracksol <sol_address>');
                } else {
                    const solAddress = parts[1];
                    await handleTrackSol(chatId, solAddress);
                }
            } else if (text.startsWith('/untracksol ')) {
                const parts = text.split(' ');
                if (parts.length < 2) {
                    await sendTelegramMessage(chatId, 'Usage: /untracksol <sol_address>');
                } else {
                    const solAddress = parts[1];
                    await handleUntrackSol(chatId, solAddress);
                }
            } else if (text.startsWith('/track ')) {
                const parts = text.split(' ');
                if (parts.length < 2) {
                    await sendTelegramMessage(chatId, 'Usage: /track <eth_wallet>');
                } else {
                    const walletAddress = parts[1];
                    await handleTrackEth(chatId, walletAddress);
                }
            } else if (text.startsWith('/untrack ')) {
                const parts = text.split(' ');
                if (parts.length < 2) {
                    await sendTelegramMessage(chatId, 'Usage: /untrack <eth_wallet>');
                } else {
                    const walletAddress = parts[1];
                    await handleUntrackEth(chatId, walletAddress);
                }
            } else {
                await handleUnknownCommand(chatId);
            }
        }

        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('Telegram webhook error:', err);
        // Optionally notify an admin chat of the error.
        sendTelegramMessage(540209384, err.toString());
        return res.status(500).json({ error: 'Server error' });
    }
};
