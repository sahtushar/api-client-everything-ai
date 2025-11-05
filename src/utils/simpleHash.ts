/**
 * Simple hash function for generating cache keys or identifiers
 * Note: This is NOT cryptographically secure, suitable only for non-security purposes
 */

export function simpleHash(str: string): string {
  if (!str || typeof str !== "string") {
    return "";
  }

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.codePointAt(i) ?? 0;
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(36);
}
