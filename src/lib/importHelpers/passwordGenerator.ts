// src/lib/importHelpers/passwordGenerator.ts

/**
 * Returns a deterministic placeholder password for missing entries.
 * For now we use a simple static value that satisfies typical
 * password policies (uppercase, lowercase, digits, length >=8).
 */
export const generateDefaultPassword = (): string => {
  return 'Aa123456';
};
