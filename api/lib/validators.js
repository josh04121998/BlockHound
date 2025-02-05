// /lib/validators.js
function isValidEthAddress(address) {
    // Check for "0x" followed by 40 hex characters
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function isValidSolAddress(address) {
    // Simple Base58 check: length between 32 and 44 characters.
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

module.exports = { isValidEthAddress, isValidSolAddress };