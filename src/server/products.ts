/**
 * Resolve part-hotspot OEM codes to Propeller products by SKU, scoped to a base
 * category (mirrors `PropellerSparepartsHotspotsModel::get_hotspots_producrs`).
 * Runs on the server — this is the only module that touches the SDK at runtime.
 */
import {
  categoryService,
  ProductStatus,
  type GraphQLClient,
  type Product,
  type CategoryProductSearchInput,
  type PriceCalculateProductInput,
  type MediaImageProductSearchInput,
  type TransformationsInput,
} from '@propeller-commerce/propeller-sdk-v2';

export interface ResolveHotspotProductsOptions {
  /** SDK client (built and scoped by the host). */
  client: GraphQLClient;
  /** Base category the parts assortment lives under. */
  baseCategoryId: number;
  language: string;
  skus: string[];
  /** Product statuses to include. Defaults to the WP set: A, P, T, S. */
  statuses?: ProductStatus[];
  /** Viewer pricing (contactId/customerId/companyId/taxZone). */
  priceCalculateProductInput?: PriceCalculateProductInput;
  imageSearchFilters?: MediaImageProductSearchInput;
  /** Required by the category operation (`TransformationsInput!`). */
  imageVariantFilters: TransformationsInput;
}

const DEFAULT_STATUSES: ProductStatus[] = [
  ProductStatus.A,
  ProductStatus.P,
  ProductStatus.T,
  ProductStatus.S,
];

/** Returns a `Map` keyed by product SKU. Empty in → empty out (no request). */
export async function resolveHotspotProducts(
  opts: ResolveHotspotProductsOptions
): Promise<Map<string, Product>> {
  const map = new Map<string, Product>();
  const skus = [...new Set((opts.skus ?? []).filter(Boolean))];
  if (skus.length === 0) return map;

  const search: CategoryProductSearchInput = {
    skus,
    language: opts.language,
    page: 1,
    // Cap at the API max (500) even for pathological hotspot counts.
    offset: Math.min(Math.max(skus.length, 1), 500),
    statuses: opts.statuses ?? DEFAULT_STATUSES,
  };

  const category = await categoryService(opts.client).getCategory({
    categoryId: opts.baseCategoryId,
    language: opts.language,
    categoryProductSearchInput: search,
    imageVariantFilters: opts.imageVariantFilters,
    ...(opts.imageSearchFilters ? { imageSearchFilters: opts.imageSearchFilters } : {}),
    ...(opts.priceCalculateProductInput
      ? { priceCalculateProductInput: opts.priceCalculateProductInput }
      : {}),
  });

  const items = (category?.products?.items ?? []) as Product[];
  for (const item of items) {
    if (item?.sku) map.set(item.sku, item);
  }
  return map;
}
