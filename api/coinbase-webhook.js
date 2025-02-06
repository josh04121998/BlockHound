// /pages/api/coinbase-webhook.js
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

module.exports = async (req, res) => {
    // (Optionally, verify the Coinbase Commerce webhook signature here.)
    const event = req.body;
    console.log('Coinbase webhook event received:', JSON.stringify(event, null, 2));

    // Process a confirmed charge event.
    if (event && event.event && event.event.type === "charge:confirmed") {
        const metadata = event.event.data.metadata;

        // Convert the telegram_chat_id to an integer and then back to a string,
        // so that "540209384.0" becomes "540209384".
        const rawChatId = metadata.telegram_chat_id;
        const telegramChatId = String(parseInt(rawChatId, 10));
        const plan = metadata.plan; // should be 'basic'

        // Upsert a subscription record.
        const { error } = await supabase
            .from('subscriptions')
            .upsert({
                telegram_chat_id: telegramChatId,
                plan: plan,
                paid: true,
                purchased_at: new Date().toISOString(),
                expiration_date: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000).toISOString() // one month later
            }, { onConflict: ['telegram_chat_id'] });

        if (error) {
            console.error('Error updating subscription:', error);
        }
    }

    return res.status(200).json({ received: true });
};
