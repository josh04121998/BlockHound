require("dotenv").config(); // Load environment variables for local development
const { default: Moralis } = require("moralis");
const express = require("express");

const app = express();
const { initializeMoralis } = require('./initializeMoralis');

// Portfolio endpoint
app.get("/api/portfolio", async (req, res) => {
  const { address } = req.query;

  if (!address) {
    return res.status(400).json({ error: "Missing address query parameter" });
  }

  try {
    const Moralis = await initializeMoralis();

    // Fetch portfolio data
    const [netWorthResponse, activeChainsResponse, tokenBalancesPriceResponse] = await Promise.all([
      Moralis.EvmApi.wallets.getWalletNetWorth({
        excludeSpam: true,
        excludeUnverifiedContracts: false,
        address,
      }),
      Moralis.EvmApi.wallets.getWalletActiveChains({
        address,
      }),
      Moralis.EvmApi.wallets.getWalletTokenBalancesPrice({
        chain: "0x1", // Ethereum Mainnet
        address,
        excludeSpam: true,
        excludeUnverifiedContracts: false,
      }),
    ]);

    const combinedResponse = {
      netWorth: netWorthResponse.raw,
      activeChains: activeChainsResponse.raw,
      tokenBalancesPrice: tokenBalancesPriceResponse?.result,
    };

    res.json(combinedResponse);
  } catch (error) {
    console.error("Error fetching portfolio data:", error);
    res.status(500).json({ error: "An error occurred while fetching portfolio data." });
  }
});

// Export the handler to be used by Vercel's serverless environment
module.exports = (req, res) => {
  app(req, res);  // Process the request with the express app
};
