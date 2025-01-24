const fetch = require('node-fetch-commonjs');

module.exports = async (req, res) => {
  const { address } = req.query;
  const chain = 'eth';
  const order = 'DESC';

  if (!address) {
    return res.status(400).json({ error: 'Missing address query parameter' });
  }

  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fromDate = sevenDaysAgo.toISOString();

    const url = `https://deep-index.moralis.io/api/v2.2/wallets/${address}/swaps?chain=${chain}&order=${order}&from_date=${fromDate}`;

    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'X-API-Key': process.env.MORALIS_API_KEY,
      },
    };

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json(errorData);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching wallet PnL data:', error);
    res.status(500).json({ error: 'An error occurred while fetching wallet PnL data.' });
  }
};
