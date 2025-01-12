const { default: Moralis } = require("moralis");

let isMoralisInitialized = false;

const initializeMoralis = async () => {
  if (!isMoralisInitialized) {
    await Moralis.start({
      apiKey: process.env.MORALIS_API_KEY,
    });
    isMoralisInitialized = true;
    console.log("Moralis initialized successfully.");
  }
  return Moralis;
};

module.exports = initializeMoralis;
