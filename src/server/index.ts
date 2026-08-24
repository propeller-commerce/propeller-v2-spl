/**
 * `@propeller-commerce/propeller-v2-spl/server` — framework-agnostic server
 * surface. The ONLY entry that touches the SDK at runtime; host `/api/spl/*`
 * routes import from here. Never import this from a Client Component.
 */
export { createSplClient } from './client';
export type { SplClient, SplClientConfig } from './client';

export { resolveHotspotProducts } from './products';
export type { ResolveHotspotProductsOptions } from './products';

export { assembleDrawing, assembleRoot } from './assemble';
export type { ProductResolver } from './assemble';

// Pure helpers + types, re-exported for convenience so a route needs one import.
export { buildTree, findNode, breadcrumbTrail } from '../tree';
export {
  primaryFunc,
  isPartHotspot,
  partitionHotspots,
  hotspotSkus,
  hotspotName,
  buildCards,
  buildNav,
} from '../hotspots';
export type {
  SplDrawingNode,
  SplHotspot,
  SplHotspotFunc,
  SplOverviewEntry,
  SplDrawingTreeResponse,
  SplHotspotsResponse,
  SparePartCard,
  SparePartKind,
  SplDrawingResult,
  SplRootResult,
  SplContactForm,
  SplContactPayload,
} from '../types';
