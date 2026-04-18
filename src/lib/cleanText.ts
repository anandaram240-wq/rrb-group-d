/**
 * Cleans mojibake (UTF-8 encoding errors) from text at render time.
 * This fixes broken characters like â€™ → ', â€˜ → ', â€" → – etc.
 */
export function cleanText(text: string): string {
  if (!text) return text;

  return text
    // Quotes / Apostrophes
    .replace(/â€™/g, "'")
    .replace(/â€˜/g, "'")
    .replace(/â€œ/g, '"')
    .replace(/â€[^\w]/g, '"')     // â€ followed by non-word = right double quote
    .replace(/â€²/g, "'")          // prime
    // Dashes
    .replace(/â€"/g, '–')          // en-dash
    .replace(/â€\u0094/g, '—')    // em-dash
    .replace(/â€"/g, '—')
    // Symbols
    .replace(/â€¢/g, '•')          // bullet
    .replace(/â€¦/g, '...')        // ellipsis
    .replace(/â‚¹/g, '₹')          // rupee
    .replace(/â„¢/g, '™')          // trademark
    // Math
    .replace(/Ã—/g, '×')           // multiplication
    .replace(/Ã·/g, '÷')           // division
    .replace(/â‰¤/g, '≤')
    .replace(/â‰¥/g, '≥')
    .replace(/âˆš/g, '√')          // square root
    // Superscripts / Degree
    .replace(/Â²/g, '²')
    .replace(/Â³/g, '³')
    .replace(/Â°/g, '°')
    // Currency
    .replace(/Â¥/g, '₹')           // Yen → Rupee
    .replace(/¥/g, '₹')            // Yen → Rupee
    // Accented
    .replace(/Ã©/g, 'é')
    .replace(/Ã¨/g, 'è')
    .replace(/Ã§/g, 'ç')
    .replace(/Ã±/g, 'ñ')
    .replace(/Ã¡/g, 'á')
    .replace(/Ã­/g, 'í')
    .replace(/Ã³/g, 'ó')
    .replace(/Ãº/g, 'ú')
    // Greek
    .replace(/Î±/g, 'α')
    .replace(/Î²/g, 'β')
    .replace(/Î³/g, 'γ')
    .replace(/Î´/g, 'δ')
    .replace(/Î¸/g, 'θ')
    .replace(/Ï€/g, 'π')
    .replace(/Î©/g, 'Ω')
    .replace(/Î¼/g, 'μ')
    // Cleanup stray Â
    .replace(/Â /g, ' ')
    .replace(/Â(?=[a-zA-Z0-9])/g, '')
    .replace(/Â$/g, '')
    // Fix merged words at start
    .replace(/\bAdealer\b/g, 'A dealer')
    .replace(/\bAsells\b/g, 'A sells')
    .replace(/\bAtrain\b/g, 'A train')
    .replace(/\bAboat\b/g, 'A boat')
    .replace(/\bAman\b/g, 'A man')
    .replace(/\bAperson\b/g, 'A person')
    .replace(/\bAfarmer\b/g, 'A farmer')
    .replace(/\bAworker\b/g, 'A worker')
    .replace(/\bAstudent\b/g, 'A student')
    .replace(/\bAmerchant\b/g, 'A merchant')
    .replace(/\bAshopkeeper\b/g, 'A shopkeeper')
    // Fix % at start of numbers (broken ₹)
    .replace(/^%(\d)/g, '₹$1')
    // Clean double spaces
    .replace(/  +/g, ' ')
    .trim();
}
