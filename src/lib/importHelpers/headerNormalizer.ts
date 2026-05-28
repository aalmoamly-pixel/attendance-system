// src/lib/importHelpers/headerNormalizer.ts
/**
 * Normalizes sheet headers.
 * - Guarantees a column count (default 15).
 * - Generates missing header names as `Column_<index>`.
 * - Flattens merged header cells (ignores them).
 * - Returns {normalizedHeaders:string[], ignoredColumns:string[]}
 */
export function normalizeHeaders(rawHeaders: (string | undefined)[]): {
  normalizedHeaders: string[];
  ignoredColumns: string[];
} {
  const normalizedHeaders: string[] = [];
  const ignoredColumns: string[] = [];
  const total = 15; // expected column count
  for (let i = 0; i < total; i++) {
    let header = rawHeaders[i];
    if (header == null || header.trim() === '') {
      header = `Column_${i + 1}`;
    }
    // Arabic known headers list – anything not in list is ignored but kept for report
    const known = [
      'الاسم',
      'الرقم الجامعي',
      'الجوال',
      'التخصص',
      'القسم',
      'المادة',
      'رمز المادة',
      'الدكتور',
      'اليوم',
      'الوقت',
      'القاعة',
      'الباسورد',
      // add any extra known names here
    ];
    if (!known.includes(header)) {
      ignoredColumns.push(header);
    }
    normalizedHeaders.push(header);
  }
  return { normalizedHeaders, ignoredColumns };
}
