import fetch from 'node-fetch';

export default async function handler(req, res) {
  const { address } = req.query;
  const chain = 'eth';
  const order = 'DESC';

  if (!address) {
    return res.status(400).json({ error: "Missing address query parameter" });
  }

  try {
    // Calculate the fromDate as 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fromDate = sevenDaysAgo.toISOString();

    // Construct the URL
    const url = `https://deep-index.moralis.io/api/v2.2/wallets/${address}/swaps?chain=${chain}&order=${order}&from_date=${fromDate}`;

    // Define the API request options
    const options = {
      method: 'GET',
      headers: {
        'X-API-Key': process.env.MORALIS_API_KEY, // Use API key from environment variables
      },
    };

    // Make the request to the Moralis API
    const response = await fetch(url, options);

    // Handle non-200 responses from the API
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error from Moralis API:", errorData);
      return res.status(response.status).json({
        error: "Error from external API",
        details: errorData,
      });
    }

    // Parse and return the successful response
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching wallet PnL data:", error.message);
    res.status(500).json({ error: "An error occurred while fetching wallet PnL data.", details: error.message });
  }
}
