import { describe, it, expect } from 'vitest';
import {
  partitionHotspots,
  hotspotSkus,
  buildNav,
  hotspotName,
  isPartHotspot,
} from '../hotspots';
import type { SplHotspot } from '../types';

// Shapes taken from a real getHotspots payload: nav hotspots have link > -1,
// part hotspots have link === -1 and oem = the Propeller SKU.
const navHotspot: SplHotspot = {
  id: 5783427,
  pos: '01',
  func: [{ id: 1, oem: '4.1', link: 383972, linktype: 'N', overview: [{ column: 'description', value: 'Cabin 1/2' }] }],
};
const partHotspot: SplHotspot = {
  id: 5783434,
  pos: '16',
  func: [{ id: 2, oem: '440082378', link: -1, linktype: 'O', overview: [{ column: 'description', value: 'Base isolator' }] }],
};

describe('partitionHotspots', () => {
  it('splits parts (link === -1) from navigation (link > -1)', () => {
    const { partHotspots, navHotspots } = partitionHotspots([navHotspot, partHotspot]);
    expect(partHotspots.map((h) => h.id)).toEqual([5783434]);
    expect(navHotspots.map((h) => h.id)).toEqual([5783427]);
    expect(isPartHotspot(partHotspot)).toBe(true);
    expect(isPartHotspot(navHotspot)).toBe(false);
  });

  it('tolerates empty / missing input', () => {
    expect(partitionHotspots([])).toEqual({ partHotspots: [], navHotspots: [] });
  });
});

describe('hotspotSkus', () => {
  it('returns distinct non-empty OEMs', () => {
    expect(hotspotSkus([partHotspot, partHotspot])).toEqual(['440082378']);
  });
});

describe('buildNav', () => {
  it('maps nav hotspot id → target drawing id', () => {
    expect(buildNav([navHotspot])).toEqual({ '5783427': 383972 });
    expect(buildNav([partHotspot])).toEqual({});
  });
});

describe('hotspotName', () => {
  it('reads the overview description, falling back to oem', () => {
    expect(hotspotName(partHotspot)).toBe('Base isolator');
    expect(hotspotName({ id: 9, pos: '9', func: [{ id: 3, oem: 'ABC', link: -1 }] })).toBe('ABC');
  });
});
