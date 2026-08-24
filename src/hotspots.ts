/**
 * Pure hotspot helpers (no SDK, no React). Splits hotspots into parts vs
 * navigation and projects part hotspots into right-column cards once their
 * products are resolved.
 */
import type {
  SplHotspot,
  SplHotspotFunc,
  SparePartCard,
  SparePartKind,
} from './types';
import type { Product } from '@propeller-commerce/propeller-sdk-v2';

/** The primary function of a hotspot (`func[0]`), if present. */
export function primaryFunc(h: SplHotspot): SplHotspotFunc | undefined {
  return h.func?.[0];
}

/**
 * A part hotspot resolves to a Propeller product; a navigation hotspot drills
 * to another drawing. Ports `get_hotspots_oem_codes` (which skips `link > -1`).
 */
export function isPartHotspot(h: SplHotspot): boolean {
  return primaryFunc(h)?.link === -1;
}

/** Split hotspots into `{ partHotspots, navHotspots }`. */
export function partitionHotspots(hotspots: SplHotspot[]): {
  partHotspots: SplHotspot[];
  navHotspots: SplHotspot[];
} {
  const partHotspots: SplHotspot[] = [];
  const navHotspots: SplHotspot[] = [];
  for (const h of hotspots ?? []) {
    if (isPartHotspot(h)) partHotspots.push(h);
    else navHotspots.push(h);
  }
  return { partHotspots, navHotspots };
}

/** Distinct, non-empty OEM codes (= Propeller SKUs) across the part hotspots. */
export function hotspotSkus(partHotspots: SplHotspot[]): string[] {
  const seen = new Set<string>();
  for (const h of partHotspots) {
    const oem = primaryFunc(h)?.oem?.trim();
    if (oem) seen.add(oem);
  }
  return [...seen];
}

/**
 * Navigation map for the canvas: hotspot id → target drawing id, for hotspots
 * that drill (`link > -1`). Keyed by string (JSON object keys) to match the
 * `data-hotspot-id` the canvas reads off the SVG.
 */
export function buildNav(navHotspots: SplHotspot[]): Record<string, number> {
  const nav: Record<string, number> = {};
  for (const h of navHotspots) {
    const link = primaryFunc(h)?.link;
    if (typeof link === 'number' && link > -1) nav[String(h.id)] = link;
  }
  return nav;
}

/** Fallback part name from the `overview` `description` column (else the OEM). */
export function hotspotName(h: SplHotspot): string {
  const func = primaryFunc(h);
  const desc = func?.overview?.find((o) => o.column === 'description')?.value;
  return desc?.trim() || func?.oem || '';
}

/**
 * Project part hotspots into right-column cards, matching each hotspot's OEM to
 * a resolved product by SKU. Determines the `kind`:
 * product + `DEFAULT` → `default`, product + `ON_REQUEST` → `on-request`,
 * no product → `not-found`.
 */
export function buildCards(
  partHotspots: SplHotspot[],
  productsBySku: Map<string, Product>
): SparePartCard[] {
  return partHotspots.map((h) => {
    const func = primaryFunc(h);
    const sku = func?.oem?.trim() ?? '';
    const product = (sku && productsBySku.get(sku)) || null;
    let kind: SparePartKind;
    if (!product) kind = 'not-found';
    else kind = product.priceData?.display === 'ON_REQUEST' ? 'on-request' : 'default';
    return {
      hotspotId: h.id,
      pos: h.pos,
      sku,
      name: product?.names?.[0]?.value?.trim() || hotspotName(h),
      kind,
      product,
    };
  });
}
