/**
 * Assemble a drawing (SVG + resolved cards) — the work the host `/api/spl/*`
 * routes do. Ports `PropellerSparepartsAjax::get_drawing` / `get_drawings`.
 *
 * Waterfall collapsed: `getDrawing` runs concurrently with the
 * `getHotspots → resolveProducts → buildCards` chain (only the cards depend on
 * the hotspots; the SVG is independent).
 */
import type { Product } from '@propeller-commerce/propeller-sdk-v2';
import type { SplClient } from './client';
import type { SplDrawingResult, SplRootResult } from '../types';
import { buildTree } from '../tree';
import { partitionHotspots, hotspotSkus, buildCards, buildNav } from '../hotspots';

/**
 * Resolve part SKUs to products. The host supplies this closure (bound to its
 * SDK client + viewer scope + image filters) so assembly stays decoupled from
 * how products are fetched — see `resolveHotspotProducts`.
 */
export type ProductResolver = (skus: string[]) => Promise<Map<string, Product>>;

export async function assembleDrawing(
  splClient: SplClient,
  drawingId: string | number,
  resolveProducts: ProductResolver
): Promise<SplDrawingResult> {
  const drawingP = splClient.getDrawing(drawingId);
  const resolvedP = splClient.getHotspots(drawingId).then(async (res) => {
    const { partHotspots, navHotspots } = partitionHotspots(res.hotspots ?? []);
    const skus = hotspotSkus(partHotspots);
    const products = skus.length ? await resolveProducts(skus) : new Map<string, Product>();
    return { cards: buildCards(partHotspots, products), nav: buildNav(navHotspots) };
  });
  const [drawing, resolved] = await Promise.all([drawingP, resolvedP]);
  return { drawing, cards: resolved.cards, nav: resolved.nav };
}

export async function assembleRoot(
  splClient: SplClient,
  publicationId: string | number,
  resolveProducts: ProductResolver
): Promise<SplRootResult> {
  const treeRes = await splClient.getDrawingTree(publicationId);
  const flat = treeRes.tree ?? [];
  const tree = buildTree(flat);
  const rootId =
    flat.find((n) => n.selected)?.id ??
    flat.find((n) => n.parent === -1)?.id ??
    flat[0]?.id;
  if (rootId == null) return { tree, drawing: '', cards: [], nav: {} };
  const { drawing, cards, nav } = await assembleDrawing(splClient, rootId, resolveProducts);
  return { tree, drawing, cards, nav };
}
