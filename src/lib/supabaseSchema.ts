// src/lib/supabaseSchema.ts
/**
 * Helper to refresh Supabase client schema cache for one or more tables.
 * It performs a lightweight SELECT on each table which forces the JS client
 * to fetch the latest column metadata from PostgREST.
 */
export async function refreshSchema(tables: string[]) {
  if (!(globalThis as any).supabase) return;
  try {
    // Run all selects in parallel, ignoring results.
    await Promise.all(
      tables.map((tbl) =>
        (globalThis as any).supabase.from(tbl).select('id', { count: 'exact', head: true })
      )
    );
    console.info('[Database System] Schema cache refreshed for', tables.join(','));
  } catch (e) {
    console.warn('[Database System] Failed to refresh schema cache', e);
  }
}
