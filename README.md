# @propeller-commerce/propeller-v2-spl

SpareParts Live (SPL) interactive spare-parts browser for the Propeller
eCommerce V2 platform — a **drawing tree** (left), a **pan/zoom technical
drawing with hotspots** (middle), and a **panel of Propeller products tied to
the hotspots** (right). Clicking a hotspot focuses its product; clicking a
product highlights its hotspot. Ported from the `propeller-sparepartslive`
WordPress plugin.

## How it works

The [SpareParts Live API](https://spareparts.live) exposes three endpoints
(drawing tree / drawing SVG / hotspots). Each hotspot is either a **navigation**
hotspot (drills to another drawing) or a **part** hotspot whose OEM code equals a
Propeller **SKU**, resolved to a product via `@propeller-commerce/propeller-sdk-v2`.

The **SPL token is a server secret**, so the browser never calls SPL directly.
The host app exposes thin `/api/spl/*` routes (using this package's `./server`
helpers) that proxy the SPL API and resolve products; the client `<SparePartsLive>`
panel calls those routes.

## Two entry points

| Import | Contents | Runs |
|---|---|---|
| `@propeller-commerce/propeller-v2-spl` | React surface (`<SparePartsLive>`, hooks) — `"use client"` | client |
| `@propeller-commerce/propeller-v2-spl/server` | `createSplClient`, `resolveHotspotProducts`, `assembleDrawing`/`assembleRoot`, pure helpers | server (touches the SDK) |
| `@propeller-commerce/propeller-v2-spl/styles.css` | self-contained styles (themeable via CSS vars) | — |

## Host wiring (Next.js sketch)

```ts
// app/api/spl/drawings/route.ts
import { createSplClient, assembleRoot, resolveHotspotProducts } from '@propeller-commerce/propeller-v2-spl/server';

const spl = createSplClient({ baseUrl: process.env.SPL_BASE_URL!, token: process.env.SPL_TOKEN! });
const resolve = (skus: string[]) =>
  resolveHotspotProducts({ client, baseCategoryId, language, skus, imageVariantFilters, priceCalculateProductInput });

export async function GET(req: Request) {
  const publicationId = new URL(req.url).searchParams.get('publicationId')!;
  return Response.json(await assembleRoot(spl, publicationId, resolve));
}
```

```tsx
// PDP client island
import '@propeller-commerce/propeller-v2-spl/styles.css';
import { SparePartsLive } from '@propeller-commerce/propeller-v2-spl';

<SparePartsLive
  publicationId={publicationId}
  labels={labels}                        // optional localized strings (SplLabels)
  renderProductActions={(product) => <AddToCart product={product} /* … */ />}
  onProductClick={(product) => router.push(getProductUrl(product))}
/>
```

A **not-found** part opens the built-in information-request modal, which POSTs to
`${apiBase}/contact` — the host route emails the configured contact address.
There is no `contactEmail` prop; the recipient is a host-side env var (below).

## Environment variables (host app)

This package reads **no** environment variables itself — its server helpers take
`baseUrl` / `token` as arguments. The host app supplies them, and gates the panel
on a product attribute. These are the variable names the Propeller boilerplates
use; wire your own names to the same helper arguments if you prefer.

| Variable | Scope | Example | Purpose |
|---|---|---|---|
| `SPL_BASE_URL` | server | `https://api.spareparts.live/v1` | SpareParts Live API base URL → `createSplClient({ baseUrl })`. |
| `SPL_TOKEN` | **server secret** | `cJWDUv…` | SPL API token (sent as a query param) → `createSplClient({ token })`. **Never expose to the client** — keep it out of `NEXT_PUBLIC_*`; the panel calls the host's `/api/spl/*` proxy instead. |
| `SPL_PRODUCT_ATTRIBUTE` | server | `SPAREPARTSLIVEDRAWING` | Name of the product track-attribute that gates the panel and whose value is the SPL **publication id** (`publicationId`). Empty/absent → no panel. |
| `NEXT_PUBLIC_SPL_CONTACT_EMAIL` | public | `parts@example.com` | Recipient of the "information request" a not-found part sends via the host's `/api/spl/contact` route. |

Hotspot SKUs are resolved under the host's existing base catalog category (the
boilerplates reuse `BOILERPLATE_BASE_CATEGORY_ID`) — not an SPL-specific variable,
so it isn't listed above.

> **Keep `SPL_TOKEN` server-only.** Read it exclusively in route handlers /
> server helpers and pass it to `createSplClient`. The client `<SparePartsLive>`
> never sees it — it talks to your `/api/spl/*` routes, which hold the token.

## Peer dependencies

`react` ≥ 18, `react-dom` ≥ 18, `@propeller-commerce/propeller-sdk-v2` (`*`).
