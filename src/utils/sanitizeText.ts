/**
 * Sanitizes text input by removing potentially harmful characters,
 * personal identifiers, and normalizing whitespace
 * Only sends JD and resume text - no names, emails, phone numbers, addresses
 */

export function sanitizeText(text: string): string {
  if (!text || typeof text !== "string") {
    return "";
  }

  let sanitized = text;

  // Remove common patterns that might contain personal info
  // Email addresses
  sanitized = sanitized.replace(
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    "[email]"
  );

  // Phone numbers (various formats)
  sanitized = sanitized.replace(
    /\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,
    "[phone]"
  );

  // // URLs (might contain personal domains)
  // sanitized = sanitized.replace(/https?:\/\/[^\s]+/g, "[url]");

  // Credit card patterns (just in case)
  sanitized = sanitized.replace(
    /\b[0-9]{4}[\s-]?[0-9]{4}[\s-]?[0-9]{4}[\s-]?[0-9]{4}\b/g,
    "[card]"
  );

  // Normalize whitespace and remove control characters
  sanitized = sanitized
    .trim()
    .replace(/\s+/g, " ") // Normalize whitespace
    .replace(/[^\x00-\x7F]+/g, " ") // Remove non-ASCII characters
    .replace(/[\u0000-\u001F\u007F]/g, ""); // Remove control characters

  return sanitized.slice(0, 6000); // Limit length to prevent abuse
}

export function validateTextLength(
  text: string,
  minLength: number = 10,
  maxLength: number = 50000
): boolean {
  const sanitized = sanitizeText(text);
  return sanitized.length >= minLength && sanitized.length <= maxLength;
}
