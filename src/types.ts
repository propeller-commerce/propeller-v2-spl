/**
 * Shared types for propeller-v2-spl.
 *
 * The SDK `Product` is imported TYPE-ONLY — erased at build — so this module
 * (and anything that only imports types from it) stays free of the SDK runtime
 * and is safe in the client bundle.
 */
import type { Product } from '@propeller-commerce/propeller-sdk-v2';

/** A node in the SPL drawing tree (`getDrawingTree.php`). Flat list; `parent === -1` = root. */
export interface SplDrawingNode {
  id: number;
  name: string;
  parent: number;
  sequence?: number;
  oem?: string;
  level?: number;
  hscount?: number;
  funccount?: number;
  oemcount?: number;
  linkcount?: number;
  selected?: boolean;
  /** Populated by `buildTree` (absent on the raw API list). */
  children?: SplDrawingNode[];
}

/** One `overview` column entry on a hotspot function (e.g. `{ column: 'description', value: 'Blower' }`). */
export interface SplOverviewEntry {
  column: string;
  value: string;
}

/** A hotspot's function payload (`func[0]`). */
export interface SplHotspotFunc {
  id: number;
  /** OEM code — equals the Propeller SKU for part hotspots (`link === -1`). */
  oem: string;
  /** `-1` = part; `> -1` = navigate to that drawing id. */
  link: number;
  /** `'O'` = order (part), `'N'` = navigation. */
  linktype?: string;
  article?: string;
  overview?: SplOverviewEntry[];
  shoplink?: string;
  unshoplink?: string;
}

/** A hotspot (`getHotspots.php`). The SVG rect id is `hs<id>`. */
export interface SplHotspot {
  id: number;
  /** Position badge, e.g. `"01"`, `"16"`. */
  pos: string;
  twin?: number;
  func: SplHotspotFunc[];
}

/** `getDrawingTree.php` response. */
export interface SplDrawingTreeResponse {
  tree: SplDrawingNode[];
  hook?: number;
  extlinks?: unknown[];
}

/** `getHotspots.php` response. */
export interface SplHotspotsResponse {
  hotspots: SplHotspot[];
}

/**
 * Card kind:
 * - `default`    — product found, normal price → add-to-cart.
 * - `on-request` — product found, `priceData.display === 'ON_REQUEST'` → request a price.
 * - `not-found`  — SKU has no Propeller product → information request (mailto).
 */
export type SparePartKind = 'default' | 'on-request' | 'not-found';

/** A resolved right-column card: a part hotspot plus its Propeller product (or `null`). */
export interface SparePartCard {
  /** Numeric SPL hotspot id — the SVG rect carries `id="hs<hotspotId>"`. */
  hotspotId: number;
  pos: string;
  /** Product name if resolved, else the SPL `overview` description. */
  name: string;
  /** `func[0].oem`. */
  sku: string;
  kind: SparePartKind;
  product: Product | null;
}

/** The "Information request" contact form (WP contact modal parity). */
export interface SplContactForm {
  company: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  remarks?: string;
  phone: string;
}

/** POST body the host `/api/spl/contact` route receives. */
export interface SplContactPayload {
  /** The part the request is about. */
  part: { name: string; sku: string; pos: string };
  /** The host (machine) product the drawing belongs to. */
  hostProduct?: { name?: string; sku?: string };
  /** Drawing path names, root → current. */
  breadcrumb?: string[];
  form: SplContactForm;
}

/** Payload the host `/api/spl/drawing` route returns. */
export interface SplDrawingResult {
  /** Raw SVG string (`#svgRoot`). */
  drawing: string;
  cards: SparePartCard[];
  /** Navigation hotspots: SVG hotspot id → target drawing id (drill-down). */
  nav: Record<string, number>;
}

/** Payload the host `/api/spl/drawings` (root) route returns — adds the tree. */
export interface SplRootResult extends SplDrawingResult {
  tree: SplDrawingNode[];
}

/** UI labels — all optional; the components fall back to English. */
export interface SplLabels {
  title?: string;
  sku?: string;
  available?: string;
  outOfStock?: string;
  priceOnRequest?: string;
  requestPrice?: string;
  excludingVat?: string;
  includingVat?: string;
  productNotFound?: string;
  informationRequest?: string;
  loading?: string;
  error?: string;
  retry?: string;
  zoomIn?: string;
  zoomOut?: string;
  zoomReset?: string;
  poweredBy?: string;
  // Contact modal
  interestedIn?: string;
  companyName?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  emailAddress?: string;
  remarks?: string;
  phoneNumber?: string;
  cancel?: string;
  sendRequest?: string;
  contactSuccess?: string;
  contactError?: string;
  close?: string;
}
