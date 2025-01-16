// types/SwapTypes.ts
export interface Swap {
    transactionHash: string;
    transactionType: string;
    baseQuotePrice: string;
    blockTimestamp: string;
    pairLabel: string;
    exchangeName: string;
    exchangeLogo: string;
    bought: {
      address: string;
      amount: string;
      usdPrice: number;
      usdAmount: number;
      symbol: string;
      logo: string;
      name: string;
    };
    sold: {
      address: string;
      amount: string;
      usdPrice: number;
      usdAmount: number;
      symbol: string;
      logo: string;
      name: string;
    };
    totalValueUsd: number;
  }
  
  export interface SwapResponse {
    cursor: string;
    page: number;
    pageSize: number;
    result: Swap[];
  }
  