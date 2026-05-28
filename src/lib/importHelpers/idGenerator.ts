// src/lib/importHelpers/idGenerator.ts
/**
 * Generates placeholder academic IDs when missing.
 * Format: 2620XXXX where XXXX is a random 4‑digit number.
 * Keeps a Set to avoid duplicates within the same import run.
 */
export class AcademicIdGenerator {
  private used = new Set<string>();
  generate(): string {
    let id: string;
    do {
      const suffix = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0');
      id = `2620${suffix}`;
    } while (this.used.has(id));
    this.used.add(id);
    return id;
  }
}

/**
 * Generic UUID‑like generator for temporary IDs (students, subjects, etc.).
 */
export function generateTempId(prefix: string = 'tmp') {
  const rand = Math.random().toString(36).substring(2, 10);
  return `${prefix}-${Date.now()}-${rand}`;
}
