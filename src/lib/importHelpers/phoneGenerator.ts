// src/lib/importHelpers/phoneGenerator.ts
/**
 * Generates a unique placeholder phone number in the format 05XXXXXXXX.
 * It keeps an in‑memory Set of already generated numbers for the current import run.
 */
export class PhoneGenerator {
  private used = new Set<string>();

  generate(): string {
    let phone: string;
    do {
      const randomPart = Math.floor(Math.random() * 1e8)
        .toString()
        .padStart(8, '0');
      phone = `05${randomPart}`;
    } while (this.used.has(phone));
    this.used.add(phone);
    return phone;
  }
}
