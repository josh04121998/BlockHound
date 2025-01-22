import axios from 'axios';

export default async function handler(req, res) {
  const { address } = req.query;
  const chain = 'eth';
  const order = 'DESC';

  if (!address) {
    return res.status(400).json({ error: "Missing address query parameter" });
  }

  try {
    // Calculate the `fromDate` as 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fromDate = sevenDaysAgo.toISOString();

    // Construct the URL
    const url = `https://deep-index.moralis.io/api/v2.2/wallets/${address}/swaps?chain=${chain}&order=${order}&from_date=${fromDate}`;

    // Set the axios request configuration
    const config = {
      method: 'GET',
      url,
      headers: {
        accept: 'application/json',
        'X-API-Key': process.env.MORALIS_API_KEY, // Use your environment variable
      },
      timeout: 60000, // Set timeout to 60 seconds
    };

    // Make the API request using axios
    const response = await axios(config);

    // Send the successful response data
    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error fetching wallet swaps data:", error);

    // Handle timeout or network issues
    if (error.code === 'ECONNABORTED') {
      res.status(504).json({ error: "Request timed out. Please try again later." });
    } else if (error.response) {
      // Handle errors returned by the Moralis API
      res.status(error.response.status).json(error.response.data);
    } else {
      // Handle other unexpected errors
      res.status(500).json({ error: "An unexpected error occurred while fetching wallet swaps data." });
    }
  }
}
