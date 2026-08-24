import { vi, describe, it, expect } from 'vitest';

// Replace the SDK entirely — the test asserts how resolveHotspotProducts calls
// the category service and maps the result, without a live client.
vi.mock('@propeller-commerce/propeller-sdk-v2', () => ({
  ProductStatus: { A: 'A', N: 'N', P: 'P', S: 'S', R: 'R', T: 'T' },
  categoryService: (client: { lastVars?: unknown }) => ({
    getCategory: async (vars: unknown) => {
      client.lastVars = vars;
      return { products: { items: [{ sku: '440082378' }, { sku: '440083794' }] } };
    },
  }),
}));

import { resolveHotspotProducts } from '../server/products';

describe('resolveHotspotProducts', () => {
  it('dedupes skus, queries the base category, and maps by sku', async () => {
    const client: { lastVars?: any } = {};
    const map = await resolveHotspotProducts({
      client: client as any,
      baseCategoryId: 17,
      language: 'nl',
      skus: ['440082378', '440083794', '440082378'],
      imageVariantFilters: {} as any,
    });

    expect(map.size).toBe(2);
    expect(map.get('440082378')?.sku).toBe('440082378');
    expect(client.lastVars.categoryId).toBe(17);
    expect(client.lastVars.categoryProductSearchInput.skus).toEqual(['440082378', '440083794']);
    expect(client.lastVars.categoryProductSearchInput.statuses).toEqual(['A', 'P', 'T', 'S']);
  });

  it('makes no request and returns empty for no skus', async () => {
    const client: { lastVars?: any } = {};
    const map = await resolveHotspotProducts({
      client: client as any,
      baseCategoryId: 17,
      language: 'nl',
      skus: [],
      imageVariantFilters: {} as any,
    });
    expect(map.size).toBe(0);
    expect(client.lastVars).toBeUndefined();
  });
});
