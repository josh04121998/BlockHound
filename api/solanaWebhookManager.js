// solanaWebhookManager.js
const { Helius, TransactionType, Address } = require('helius-sdk');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const MAX_ADDRESSES_PER_WEBHOOK = 25; // or whatever Helius limit
const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const DEFAULT_WEBHOOK_URL = 'https://www.block-hound.com//api/solana-webhook'; // where Helius calls
const DEFAULT_TRANSACTION_TYPES = [TransactionType.SWAP];

async function findOrCreateWebhook() {
    // 1. Find a webhook in DB with address_count < MAX_ADDRESSES_PER_WEBHOOK
    let { data: webhooks, error } = await supabase
        .from('solana_webhooks')
        .select('*')
        .lt('address_count', MAX_ADDRESSES_PER_WEBHOOK)
        .limit(1);

    if (error) {
        throw new Error('DB error finding webhook: ' + error.message);
    }

    if (webhooks && webhooks.length > 0) {
        // Found an existing one with capacity
        return webhooks[0];
    }

    // 2. Create a new webhook via Helius
    const helius = new Helius(HELIUS_API_KEY);
    const newWebhookResponse = await helius.createWebhook({
        accountAddresses: [Address.NONE], // Start empty, we’ll add address later
        transactionTypes: DEFAULT_TRANSACTION_TYPES,
        webhookURL: DEFAULT_WEBHOOK_URL
    });

    // newWebhookResponse has .id (Helius webhook ID)
    const { webhookID: newHeliusWebhookID } = newWebhookResponse;

    // 3. Insert a row in 'solana_webhooks'
    const { data: inserted, error: insertError } = await supabase
        .from('solana_webhooks')
        .insert([
            {
                webhook_id: newHeliusWebhookID,
                address_count: 0,
                webhook_url: DEFAULT_WEBHOOK_URL,
                transaction_types: DEFAULT_TRANSACTION_TYPES,
            },
        ])
        .select()
        .single();

    if (insertError) {
        // Roll back by deleting the Helius webhook if you want
        // await helius.deleteWebhook(newHeliusWebhookID);
        throw new Error('DB error inserting new webhook: ' + insertError.message);
    }

    return inserted; // the row from supabase, e.g. { id, webhook_id, address_count, ... }
}

async function addAddressToWebhook(webhookRow, solAddress) {
    // 1. Fetch current addresses from Helius
    const helius = new Helius(HELIUS_API_KEY);
    const existingWebhook = await helius.getWebhookByID(webhookRow.webhook_id);

    const currentAddresses = existingWebhook.accountAddresses || [];
    // 2. Combine with the new one
    const updatedSet = new Set([...currentAddresses, solAddress]);
    const updatedAddresses = Array.from(updatedSet);

    // 3. Update the webhook in Helius
    await helius.updateWebhook({
        webhookID: webhookRow.webhook_id,
        transactionTypes: existingWebhook.transactionTypes || DEFAULT_TRANSACTION_TYPES,
        accountAddresses: updatedAddresses,
        webhookURL: existingWebhook.webhookURL || DEFAULT_WEBHOOK_URL,
    });

    // 4. Update DB address_count if we actually added a new address
    if (!currentAddresses.includes(solAddress)) {
        const newCount = (webhookRow.address_count || 0) + 1;
        await supabase
            .from('solana_webhooks')
            .update({ address_count: newCount })
            .eq('id', webhookRow.id);
    }
}

async function trackSolanaAddress(chatId, solAddress) {
    // 1. Check if user already tracks
    const { data: existing, error: existingErr } = await supabase
        .from('solana_wallets')
        .select('*')
        .eq('telegram_chat_id', chatId)
        .eq('sol_address', solAddress);

    if (existingErr) {
        throw new Error('DB error checking existing address: ' + existingErr.message);
    }
    if (existing && existing.length > 0) {
        // Already tracked
        return { success: false, reason: 'already_tracked' };
    }

    // 2. Insert wallet record with a placeholder webhook_id (0) for now
    const { data: inserted, error: insertErr } = await supabase
        .from('solana_wallets')
        .insert([{ telegram_chat_id: chatId, sol_address: solAddress }])
        .select()
        .single();

    if (insertErr) {
        throw new Error('Error inserting solana_wallets row: ' + insertErr.message);
    }

    // 3. Find or create a webhook that has capacity
    const webhookRow = await findOrCreateWebhook();
    // This is a row from 'solana_webhooks': { id, webhook_id, address_count, ... }

    // 4. Add address to that webhook in Helius
    await addAddressToWebhook(webhookRow, solAddress);

    // 5. Update the solana_wallets row so we know which webhook it’s assigned to
    await supabase
        .from('solana_wallets')
        .update({ solana_webhook_id: webhookRow.id })
        .eq('id', inserted.id);

    return { success: true, webhook_id: webhookRow.webhook_id };
}

async function untrackSolanaAddress(chatId, solAddress) {
    try {
        // 1. Find the wallet row for this user+address
        const { data: walletRows, error: walletErr } = await supabase
            .from('solana_wallets')
            .select('*')
            .eq('telegram_chat_id', chatId)
            .eq('sol_address', solAddress);

        if (walletErr) {
            throw new Error(`Error selecting solana_wallets: ${walletErr.message}`);
        }

        if (!walletRows || walletRows.length === 0) {
            // User isn't tracking this address at all
            return { success: false, reason: 'not_tracked' };
        }

        const walletRow = walletRows[0];
        const webhookIdInDB = walletRow.solana_webhook_id;

        // 2. Find the referenced webhook row from 'solana_webhooks'
        const { data: webhookRows, error: webhookErr } = await supabase
            .from('solana_webhooks')
            .select('*')
            .eq('id', webhookIdInDB);

        if (webhookErr) {
            throw new Error(`Error selecting solana_webhooks: ${webhookErr.message}`);
        }

        if (!webhookRows || webhookRows.length === 0) {
            // The webhook row is missing? Possibly an inconsistent DB state
            // We'll still remove the row from solana_wallets
            await removeSolanaWalletRow(chatId, solAddress);
            return { success: false, reason: 'webhook_not_found' };
        }

        const webhookRow = webhookRows[0]; // { id, webhook_id, address_count, ... }

        // 3. See if other users also track this same address (within the same webhook)
        const { data: sameAddressRows, error: sameAddrErr } = await supabase
            .from('solana_wallets')
            .select('*')
            .eq('solana_webhook_id', webhookRow.id)
            .eq('sol_address', solAddress);

        if (sameAddrErr) {
            throw new Error(`Error checking same address in webhook: ${sameAddrErr.message}`);
        }

        // 4. If this is the ONLY row for that address in that webhook, remove address from Helius
        const onlyThisUser = sameAddressRows && sameAddressRows.length === 1;

        // We'll remove from DB either way, because this user is untracking
        await removeSolanaWalletRow(chatId, solAddress);

        if (onlyThisUser) {
            // (a) Fetch the current addresses from Helius
            const helius = new Helius(HELIUS_API_KEY);
            const existingWebhook = await helius.getWebhookByID(webhookRow.webhook_id);
            const currentAddresses = existingWebhook.accountAddresses || [];

            // (b) Remove the address from the array
            const updatedAddresses = currentAddresses.filter((addr) => addr !== solAddress);

            // (c) Update the webhook in Helius
            await helius.updateWebhook({
                webhookID: webhookRow.webhook_id,
                transactionTypes: existingWebhook.transactionTypes,
                accountAddresses: updatedAddresses,
                webhookURL: existingWebhook.webhookURL,
            });

            // (d) Decrement address_count in DB
            const newCount = Math.max(0, (webhookRow.address_count || 0) - 1);
            await supabase
                .from('solana_webhooks')
                .update({ address_count: newCount })
                .eq('id', webhookRow.id);
        }

        // 5. Success
        return { success: true };
    } catch (error) {
        console.error('untrackSolanaAddress error:', error);
        return { success: false, reason: 'exception', error: error.message };
    }
}

// Helper: remove the row from solana_wallets
async function removeSolanaWalletRow(chatId, solAddress) {
    const { error: deleteErr } = await supabase
        .from('solana_wallets')
        .delete()
        .eq('telegram_chat_id', chatId)
        .eq('sol_address', solAddress);

    if (deleteErr) {
        console.error('Error removing user address from solana_wallets:', deleteErr);
    }
}

module.exports = {
    trackSolanaAddress,
    untrackSolanaAddress
    // You can also export findOrCreateWebhook, addAddressToWebhook, etc. if needed
};
