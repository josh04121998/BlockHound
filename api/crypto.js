const axios = require('axios');

module.exports = async (req, res) => {
    try {
        const response = await axios.get(
            'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=5&page=1&sparkline=false'
        );
        const data = response.data.map((coin) => ({
            name: coin.name,
            price: coin.current_price,
        }));
        res.json(data);
    } catch (error) {
        console.error('Error fetching crypto data:', error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
}