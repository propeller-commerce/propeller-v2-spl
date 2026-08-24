# Changelog

All notable changes to `@propeller-commerce/propeller-v2-spl` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-07-28

### Changed

- **Product card layout** — the add-to-cart / information-request action is now a
  full-width row across the bottom of the card (flush with the product image),
  with price and availability stacked in the text column above it. Consumers no
  longer need to override the card grid to fit a full-width buy control.
- `.spl__col--list` reserves its scrollbar gutter (`scrollbar-gutter: stable`),
  so the list scrollbar no longer overlaps card content.

### Added

- **Theme-token fallbacks** — the panel's `--spl-*` variables now default to the
  common storefront token names (`--spl-accent: var(--primary, …)`,
  `--spl-border: var(--border, …)`, `--spl-radius: var(--radius-container, …)`,
  etc.). A consumer already theming with those tokens (e.g.
  `propeller-v2-react-ui`) gets a matching SpareParts panel with no extra CSS;
  standalone consumers keep the built-in defaults.
- **README** — an "Environment variables (host app)" section documenting
  `SPL_BASE_URL`, `SPL_TOKEN` (server secret), `SPL_PRODUCT_ATTRIBUTE`, and
  `NEXT_PUBLIC_SPL_CONTACT_EMAIL`.

### Fixed

- README wiring sketch referenced a non-existent `contactEmail` prop; not-found
  parts use the built-in modal that POSTs to `${apiBase}/contact`.

## [0.1.0] - 2026-07-27

### Added

- Initial release — SpareParts Live (SPL) interactive spare-parts browser for
  the Propeller eCommerce V2 platform, ported from the `propeller-sparepartslive`
  WordPress plugin.
- **Client surface** (`.`): `<SparePartsLive>` panel (drawing tree + pan/zoom
  hotspot drawing + hotspot-linked product cards), `useSparePartsLive` (SWR),
  `DrawingTree`, `DrawingCanvas`, `SparePartCard`, and a `ContactModal`
  "information request" form for parts with no matching Propeller product
  (`buildInfoRequestMailto` is also exported as a plain `mailto:` fallback).
- **Server surface** (`./server`): `createSplClient` (SPL API client),
  `resolveHotspotProducts` (SKU → Propeller product via the SDK),
  `assembleDrawing` / `assembleRoot` (waterfall-collapsed drawing assembly),
  plus pure tree/hotspot helpers.
- **Styles** (`./styles.css`): self-contained, themeable via CSS variables.
