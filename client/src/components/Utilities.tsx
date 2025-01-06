export function shortAddress(address: string | undefined | null): string {
  if (!address) {
    return ''; // Return an empty string or handle the error as appropriate
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatPriceNumber(num: string): string {
  // First, handle the large number formatting with commas
  const parts = num.toString().split(".");
  
  // Add commas to the integer part
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  
  // Reassemble the number with the decimal part, if any
  return parts.join(".");
}
  