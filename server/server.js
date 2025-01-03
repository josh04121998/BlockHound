require("dotenv").config();
const express = require("express");
const path = require("path");
const Moralis = require("moralis").default;

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// Serve static files from the 'client' folder
app.use(express.static(path.join(__dirname, "../client/dist"))); // Update if using a specific build folder

// Initialize Moralis once during server startup
async function initializeMoralis() {
  try {
    await Moralis.start({
      apiKey: process.env.MORALIS_API_KEY,
    });
    console.log("Moralis initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize Moralis:", error);
    process.exit(1); // Exit the process if Moralis fails to initialize
  }
}

// Portfolio endpoint
// Define the /portfolio endpoint
app.get("/api/portfolio", async (req, res) => {
  const { address } = req.query; // Get address from query parameters

  if (!address) {
    return res.status(400).json({ error: "Missing address query parameter" });
  }

  try {
    // Use Promise.all to execute all three API calls in parallel
    const [netWorthResponse, activeChainsResponse, tokenBalancesPriceResponse] = await Promise.all([
      Moralis.EvmApi.wallets.getWalletNetWorth({
        excludeSpam: true,
        excludeUnverifiedContracts: false,
        address: address, // Use the provided address
      }),
      Moralis.EvmApi.wallets.getWalletActiveChains({
        address: address, // Use the provided address
      }),
      Moralis.EvmApi.wallets.getWalletTokenBalancesPrice({
        chain: "0x1", // Ethereum Mainnet
        address: address, // Use the provided address
        excludeSpam: true,
        excludeUnverifiedContracts: false,
        limit: 10
      }),
    ]);

    // Combine results into a single response
    const combinedResponse = {
      netWorth: netWorthResponse.raw,
      activeChains: activeChainsResponse.raw,
      tokenBalancesPrice: tokenBalancesPriceResponse?.result,
    };

    // Send the combined response to the client
    res.json(combinedResponse);
  } catch (error) {
    console.error("Error fetching portfolio data:", error);
    res.status(500).json({ error: "An error occurred while fetching portfolio data." });
  }
});

// Catch-all route to serve the frontend (important for SPA routing)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist", "index.html")); // Ensure this points to the index.html of your frontend
});

// Start the server
initializeMoralis().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
});
