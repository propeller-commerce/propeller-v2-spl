/**
 * `@propeller-commerce/propeller-v2-spl` — React client surface (the
 * `<SparePartsLive>` panel + parts). Built with a `"use client"` banner.
 *
 * This entry imports React, swr, @panzoom/panzoom, and TYPE-ONLY from the SDK —
 * it never pulls the SDK runtime or the server helpers into the client bundle.
 * Server helpers live at `@propeller-commerce/propeller-v2-spl/server`.
 *
 * Stylesheet: `import '@propeller-commerce/propeller-v2-spl/styles.css'`.
 */
export { SparePartsLive } from './react/SparePartsLive';
export type { SparePartsLiveProps } from './react/SparePartsLive';

export { useSparePartsLive } from './react/useSparePartsLive';
export type { UseSparePartsLive } from './react/useSparePartsLive';

export { DrawingTree } from './react/DrawingTree';
export type { DrawingTreeProps } from './react/DrawingTree';
export { DrawingCanvas } from './react/DrawingCanvas';
export type { DrawingCanvasProps } from './react/DrawingCanvas';
export { SparePartCard } from './react/SparePartCard';
export type { SparePartCardProps } from './react/SparePartCard';
export { ContactModal } from './react/ContactModal';
export type { ContactModalProps } from './react/ContactModal';

export { buildInfoRequestMailto } from './react/mailto';
export type { InfoRequestContext } from './react/mailto';

// Pure helpers (no SDK runtime) — handy for consumers, tree-shaken if unused.
export { buildTree, findNode, breadcrumbTrail } from './tree';
export {
  primaryFunc,
  isPartHotspot,
  partitionHotspots,
  hotspotSkus,
  hotspotName,
  buildNav,
  buildCards,
} from './hotspots';

export type {
  SplDrawingNode,
  SplHotspot,
  SplHotspotFunc,
  SplOverviewEntry,
  SplDrawingTreeResponse,
  SplHotspotsResponse,
  SparePartCard as SparePartCardData,
  SparePartKind,
  SplDrawingResult,
  SplRootResult,
  SplLabels,
  SplContactForm,
  SplContactPayload,
} from './types';
