import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Ensure environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and ANON KEY are required');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  // Input validation
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  try {
    // Insert email into the Supabase users table
    const { data, error } = await supabase
      .from('users')
      .insert([{ email }]);

    if (error) {
      // Handle Supabase-specific error
      return res.status(500).json({ error: 'Failed to subscribe', details: error.message });
    }

    res.status(200).json({ message: 'Subscribed successfully', data });
  } catch (error) {
    // Handle unexpected errors
    res.status(500).json({ error: 'An unexpected error occurred', details: error.message });
  }
}
