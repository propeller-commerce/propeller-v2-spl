import type { ReactNode } from 'react';
import type { Product } from '@propeller-commerce/propeller-sdk-v2';
import type { SparePartCard as Card, SplLabels } from '../types';

export interface SparePartCardProps {
  card: Card;
  selected: boolean;
  labels?: SplLabels;
  currencySymbol?: string;
  formatPrice?: (value: number) => string;
  /** Select this card (highlights its hotspot on the drawing). */
  onSelect: () => void;
  /** Navigate to the product's PDP (image / name click). */
  onProductClick?: (product: Product) => void;
  /**
   * The buy action for a resolved product — the host injects its canonical
   * add-to-cart control here (e.g. react-ui `<AddToCart>`, which also handles
   * price-on-request → quote), so the SPL cards behave like the rest of the
   * storefront while the package stays UI-lib free. The card renders the price
   * and stock itself. Not called for `not-found` cards.
   */
  renderProductActions?: (product: Product) => ReactNode;
  /** Open the information-request modal (for `not-found` parts). */
  onInfoRequest?: () => void;
}

interface SdkPrice {
  net?: number;
  gross?: number;
}
function priceOf(product: Product): SdkPrice {
  return ((product as unknown as { price?: SdkPrice }).price) ?? {};
}
function stockOf(product: Product): number {
  return (
    (product as unknown as { inventory?: { totalQuantity?: number } }).inventory?.totalQuantity ?? 0
  );
}

/** First usable image URL off an SDK product (tolerant of media shape variants). */
function firstImageUrl(product: Product): string | undefined {
  const media = product as unknown as {
    media?: { images?: { items?: Array<{ imageVariants?: Array<{ url?: string }>; images?: Array<{ url?: string }> }> } };
    images?: Array<{ images?: Array<{ url?: string }> }>;
  };
  const fromMedia = media.media?.images?.items?.[0];
  const url = fromMedia?.imageVariants?.[0]?.url ?? fromMedia?.images?.[0]?.url ?? media.images?.[0]?.images?.[0]?.url;
  return typeof url === 'string' ? url : undefined;
}

/**
 * Right-column card. Owns the SPL chrome (position badge, image, name/SKU,
 * selection outline) and, for `not-found` parts, the information-request
 * mailto. Product actions are delegated to `renderProductActions`.
 */
export function SparePartCard({
  card,
  selected,
  labels,
  currencySymbol = '€',
  formatPrice = (v) => v.toFixed(2).replace('.', ','),
  onSelect,
  onProductClick,
  renderProductActions,
  onInfoRequest,
}: SparePartCardProps) {
  const product = card.product;
  const imageUrl = product ? firstImageUrl(product) : undefined;
  const price = product ? priceOf(product) : {};
  const stock = product ? stockOf(product) : 0;

  const openProduct = (e: { stopPropagation: () => void }) => {
    if (product && onProductClick) {
      e.stopPropagation();
      onProductClick(product);
    }
  };

  return (
    <div
      id={`spl-card-${card.hotspotId}`}
      data-hotspot-id={card.hotspotId}
      className={'spl-card' + (selected ? ' spl-card--selected' : '')}
      onClick={onSelect}
    >
      <div className="spl-card__media">
        <span className="spl-card__badge">{card.pos}</span>
        {imageUrl ? (
          <img
            className="spl-card__img"
            src={imageUrl}
            alt={card.name}
            width={100}
            height={100}
            loading="lazy"
            onClick={openProduct}
          />
        ) : (
          <div className="spl-card__img spl-card__img--empty" aria-hidden />
        )}
      </div>

      <div className="spl-card__body">
        <div className="spl-card__name">
          {product && onProductClick ? (
            <button type="button" className="spl-card__link" onClick={openProduct}>
              {card.name}
            </button>
          ) : (
            card.name
          )}
        </div>
        <div className="spl-card__sku">
          {labels?.sku ?? 'SKU'}: {card.sku}
        </div>

        {card.kind === 'not-found' ? (
          <span className="spl-card__notfound-text">
            {labels?.productNotFound ?? 'Product not found'}
          </span>
        ) : (
          <>
            <div className="spl-card__price">
              {card.kind === 'on-request' ? (
                <span className="spl-card__price--request">
                  {labels?.priceOnRequest ?? 'Price on request'}
                </span>
              ) : (
                <>
                  <span className="spl-card__price-main">
                    {currencySymbol}&nbsp;{formatPrice(price.gross ?? 0)}{' '}
                    <small>{labels?.excludingVat ?? 'excl. VAT'}</small>
                  </span>
                  {price.net != null ? (
                    <span className="spl-card__price-sub">
                      {currencySymbol}&nbsp;{formatPrice(price.net)}{' '}
                      <small>{labels?.includingVat ?? 'incl. VAT'}</small>
                    </span>
                  ) : null}
                </>
              )}
            </div>
            <div className={'spl-card__stock ' + (stock > 0 ? 'is-in' : 'is-out')}>
              {stock > 0
                ? `${labels?.available ?? 'Available'}: ${stock}`
                : labels?.outOfStock ?? 'Out of stock'}
            </div>
          </>
        )}
      </div>

      {/* Full-width bottom row: buy control (or the not-found info-request). */}
      {card.kind === 'not-found' ? (
        onInfoRequest ? (
          <div className="spl-card__actions">
            <button
              type="button"
              className="spl-card__contact"
              onClick={(e) => {
                e.stopPropagation();
                onInfoRequest();
              }}
            >
              {labels?.informationRequest ?? 'Information request'}
            </button>
          </div>
        ) : null
      ) : product && renderProductActions ? (
        <div className="spl-card__actions spl-card__buy" onClick={(e) => e.stopPropagation()}>
          {renderProductActions(product)}
        </div>
      ) : null}
    </div>
  );
}
