// Types for cache data
export interface CacheToken {
    token_address: string;
    name: string;
    symbol: string;
    balance_formatted: string;
    usd_price: number;
    logo?: string;
  }
  
  // Types for PNL data
  interface PnlToken {
    token_address: string;
    avg_buy_price_usd: string;
    total_tokens_bought: string;
    total_tokens_sold: string;
    name: string;
    symbol: string;
  }
  
  // Types for PNL Response
  export interface PnlData {
    profitabilitySummary: {
      total_realized_profit_percentage: number;
      total_realized_profit_usd: string;
      total_trade_volume: string;
      total_count_of_trades: number;
    };
    profitability: {
      result: PnlToken[];
    };
  }
  
  // Types for Open Profits
  export interface OpenProfit {
    name: string;
    symbol: string;
    logo: string; // ✅ Now required to ensure it's always passed
    remainingTokens: number;
    currentValue: number;
    costBasis: number;
    openProfit: number;
    currentPrice: number;
  }
  