export function shortAddress(address: string | undefined | null): string {
    if (!address) {
      return ''; // Return an empty string or handle the error as appropriate
    }
  
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
  