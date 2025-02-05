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
        const telegramChatId = metadata.telegram_chat_id;
        const plan = metadata.plan; // should be 'basic'

        // Upsert a subscription record.
        const { error } = await supabase
            .from('subscriptions')
            .upsert({
                telegram_chat_id: telegramChatId,
                plan: plan,
                paid: true,
                purchased_at: new Date().toISOString(),
            }, { onConflict: ['telegram_chat_id', 'plan'] });

        if (error) {
            console.error('Error updating subscription:', error);
        }
    }

    return res.status(200).json({ received: true });
};
