const { default: Moralis } = require("moralis");
const express = require("express");
const path = require("path");

const app = express();

// Initialize Moralis
async function initializeMoralis() {
  try {
    await Moralis.start({
      apiKey: process.env.MORALIS_API_KEY,
    });
    console.log("Moralis initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize Moralis:", error);
    process.exit(1); // Exit if Moralis fails to initialize
  }
}

// Portfolio endpoint
app.get("/api/portfolio", async (req, res) => {
  const { address } = req.query;

  if (!address) {
    return res.status(400).json({ error: "Missing address query parameter" });
  }

  try {
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
        limit: 10,
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

// Vercel requires that we export a handler function to process requests
module.exports = (req, res) => {
  // Initialize Moralis if it's not done already
  if (!Moralis.CoreManager.isInitialized()) {
    initializeMoralis().then(() => {
      app(req, res); // Handle the request
    });
  } else {
    app(req, res);
  }
};
