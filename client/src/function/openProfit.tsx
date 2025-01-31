import { OpenProfit, CacheToken, PnlData } from '../components/PnlDTO';

export const calculateOpenProfits = (cache: CacheToken[], pnl: PnlData): OpenProfit[] => {
  if (!Array.isArray(cache) || cache.length === 0) {
    console.warn("⚠️ Warning: `cache` is empty or not an array.", cache);
    return [];
  }

  return pnl.profitability.result
    .map((pnlToken) => {
      const cachedToken = cache.find(
        (token) => token.token_address === pnlToken.token_address
      );

      if (!cachedToken) {
        console.warn(`⚠️ Token ${pnlToken.token_address} not found in cache.`);
        return null;
      }

      const totalTokensBought = parseFloat(pnlToken.total_tokens_bought) || 0;
      const totalTokensSold = parseFloat(pnlToken.total_tokens_sold) || 0;
      const remainingTokens = Math.max(totalTokensBought - totalTokensSold, 0);

      const currentPrice = cachedToken.usd_price;
      const currentValue = remainingTokens * currentPrice;
      const avgBuyPrice = parseFloat(pnlToken.avg_buy_price_usd) || 0;
      const costBasis = remainingTokens * avgBuyPrice;
      const openProfit = currentValue - costBasis;

      return {
        name: cachedToken.name,
        symbol: cachedToken.symbol,
        logo: cachedToken.logo || '/images/unknown.png', // ✅ Ensure logo is passed
        remainingTokens,
        currentValue,
        costBasis,
        openProfit,
        currentPrice,
      };
    })
    .filter((profit): profit is OpenProfit => profit !== null);
};
