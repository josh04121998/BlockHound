// initializeMoralis.js
import Moralis from 'moralis';

let isMoralisInitialized = false;

export async function initializeMoralis() {
  if (!isMoralisInitialized) {
    await Moralis.start({
      apiKey: process.env.MORALIS_API_KEY,
    });
    isMoralisInitialized = true;
    console.log("Moralis initialized successfully.");
  }
  return Moralis;
}
