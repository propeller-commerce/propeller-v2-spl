import { describe, it, expect } from 'vitest';
import { buildCards } from '../hotspots';
import type { SplHotspot } from '../types';
import type { Product } from '@propeller-commerce/propeller-sdk-v2';

function part(id: number, pos: string, oem: string, desc: string): SplHotspot {
  return {
    id,
    pos,
    func: [{ id: id + 1, oem, link: -1, linktype: 'O', overview: [{ column: 'description', value: desc }] }],
  };
}

// Minimal product stubs — buildCards only reads sku/priceData/names.
const defaultProduct = {
  sku: '440082378',
  priceData: { display: 'DEFAULT' },
  names: [{ value: 'Base isolator', language: 'NL' }],
} as unknown as Product;
const onRequestProduct = {
  sku: '440083794',
  priceData: { display: 'ON_REQUEST' },
  names: [{ value: 'Suction hose', language: 'NL' }],
} as unknown as Product;

describe('buildCards', () => {
  it('classifies default / on-request / not-found', () => {
    const hotspots = [
      part(1, '16', '440082378', 'Base isolator'),
      part(2, '17', '440083794', 'Suction hose'),
      part(3, '18', 'MISSING', 'Ghost part'),
    ];
    const products = new Map<string, Product>([
      ['440082378', defaultProduct],
      ['440083794', onRequestProduct],
    ]);

    const cards = buildCards(hotspots, products);
    expect(cards).toHaveLength(3);

    expect(cards[0]).toMatchObject({ hotspotId: 1, pos: '16', kind: 'default', sku: '440082378', name: 'Base isolator' });
    expect(cards[1]).toMatchObject({ hotspotId: 2, kind: 'on-request', sku: '440083794' });
    // Not-found falls back to the overview description and carries no product.
    expect(cards[2]).toMatchObject({ hotspotId: 3, kind: 'not-found', name: 'Ghost part', product: null });
  });
});
