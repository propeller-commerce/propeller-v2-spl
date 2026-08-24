import { useCallback, useState, type ReactNode } from 'react';
import type { Product } from '@propeller-commerce/propeller-sdk-v2';
import type { SplLabels, SparePartCard as SparePartCardData } from '../types';
import { useSparePartsLive } from './useSparePartsLive';
import { DrawingTree } from './DrawingTree';
import { DrawingCanvas } from './DrawingCanvas';
import { SparePartCard } from './SparePartCard';
import { ContactModal } from './ContactModal';

export interface SparePartsLiveProps {
  /** SPL publication id (from the product's SPL track attribute). */
  publicationId: string | number;
  /** Host route base for the SPL proxy. Default `/api/spl`. */
  apiBase?: string;
  labels?: SplLabels;
  className?: string;
  /** Context for the `not-found` information-request email. */
  hostProductName?: string;
  hostProductSku?: string;
  /** Buy control for resolved products (host injects react-ui `<AddToCart>`). */
  renderProductActions?: (product: Product) => ReactNode;
  /** Navigate to a product PDP (image / name click). */
  onProductClick?: (product: Product) => void;
  /** Currency symbol for card prices. Default `€`. */
  currencySymbol?: string;
  /** Price formatter. Default `v => v.toFixed(2)` with a comma decimal. */
  formatPrice?: (value: number) => string;
}

/**
 * SpareParts Live panel — drawing tree (left), pan/zoom hotspot drawing
 * (middle), hotspot-linked product cards (right). CSR: fetches on mount via the
 * host `/api/spl/*` proxy (which keeps the SPL token server-side).
 */
export function SparePartsLive({
  publicationId,
  apiBase = '/api/spl',
  labels,
  className,
  hostProductName,
  hostProductSku,
  renderProductActions,
  onProductClick,
  currencySymbol,
  formatPrice,
}: SparePartsLiveProps) {
  const {
    listNode,
    breadcrumbs,
    svg,
    cards,
    nav,
    activeDrawingId,
    selectedHotspotId,
    setSelectedHotspotId,
    loadDrawing,
    loading,
    error,
  } = useSparePartsLive(publicationId, apiBase);

  const [contactCard, setContactCard] = useState<SparePartCardData | null>(null);

  const onSelectHotspot = useCallback(
    (hotspotId: number) => {
      setSelectedHotspotId(hotspotId);
      // scroll the matching card into view (mirrors the WP behaviour)
      if (typeof document !== 'undefined') {
        document
          .getElementById(`spl-card-${hotspotId}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    },
    [setSelectedHotspotId]
  );

  const breadcrumbNames = breadcrumbs.map((b) => b.name);

  return (
    <section className={'spl' + (className ? ` ${className}` : '')}>
      <h2 className="spl__title">{labels?.title ?? 'Find your parts'}</h2>

      {error ? (
        <div className="spl__error" role="alert">
          {labels?.error ?? 'Failed to load spare parts.'}
        </div>
      ) : (
        <div className="spl__grid">
          <aside className="spl__col spl__col--tree">
            <DrawingTree listNode={listNode} activeDrawingId={activeDrawingId} onSelect={loadDrawing} />
          </aside>

          <div className="spl__col spl__col--canvas">
            {loading && !svg ? (
              <div className="spl__skeleton spl__skeleton--canvas" aria-busy="true" />
            ) : (
              <DrawingCanvas
                svg={svg}
                nav={nav}
                selectedHotspotId={selectedHotspotId}
                onSelectHotspot={onSelectHotspot}
                onNavigate={loadDrawing}
                labels={labels}
              />
            )}
          </div>

          <div className="spl__col spl__col--list">
            {loading && cards.length === 0 ? (
              <div className="spl__skeleton spl__skeleton--list" aria-busy="true" />
            ) : (
              cards.map((card) => (
                <SparePartCard
                  key={card.hotspotId}
                  card={card}
                  selected={selectedHotspotId === card.hotspotId}
                  labels={labels}
                  currencySymbol={currencySymbol}
                  formatPrice={formatPrice}
                  onSelect={() => setSelectedHotspotId(card.hotspotId)}
                  onProductClick={onProductClick}
                  renderProductActions={renderProductActions}
                  onInfoRequest={
                    card.kind === 'not-found' ? () => setContactCard(card) : undefined
                  }
                />
              ))
            )}
          </div>
        </div>
      )}

      {contactCard ? (
        <ContactModal
          card={contactCard}
          hostProductName={hostProductName}
          hostProductSku={hostProductSku}
          breadcrumb={breadcrumbNames}
          apiBase={apiBase}
          labels={labels}
          onClose={() => setContactCard(null)}
        />
      ) : null}
    </section>
  );
}
