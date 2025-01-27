import bodyParser from 'body-parser';

export default async function handler(req, res) {
    // Use body-parser's `json()` middleware to parse the request body
    await new Promise((resolve) => bodyParser.json()(req, res, resolve));

    if (req.method === 'POST') {
        console.log('Webhook received:', req.body);
        res.status(200).json({ message: 'Webhook received successfully!' });

        // Add your custom logic here
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
