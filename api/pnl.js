// pages/api/walletProfitability.js
const { initializeMoralis } = require('./initializeMoralis');

module.exports = async (req, res) => {
  const { address } = req.query;

  if (!address) {
    return res.status(400).json({ error: "Missing address query parameter" });
  }

  try {
    // Initialize Moralis
    const Moralis = await initializeMoralis();

    // Fetch wallet profitability summary
    const profitabilitySummaryResponse = await Moralis.EvmApi.wallets.getWalletProfitabilitySummary({
      chain: "0x1",
      address,
    });

    // Fetch detailed wallet profitability data
    const profitabilityResponse = await Moralis.EvmApi.wallets.getWalletProfitability({
      chain: "0x1",
      address,
    });

    const combinedResponse = {
      profitabilitySummary: profitabilitySummaryResponse.raw,
      profitability: profitabilityResponse.raw,
    };

    res.status(200).json(combinedResponse);
  } catch (error) {
    console.error("Error fetching wallet PnL data:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching wallet PnL data." });
  }
};
