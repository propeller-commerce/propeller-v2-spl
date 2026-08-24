import { useEffect, useRef } from 'react';
import Panzoom, { type PanzoomObject } from '@panzoom/panzoom';
import type { SplLabels } from '../types';

export interface DrawingCanvasProps {
  /** Raw SVG string from the SPL API (`#svgRoot` + `.pcg_hotspot` rects). */
  svg: string;
  /** hotspot id → target drawing id, for navigation hotspots. */
  nav: Record<string, number>;
  selectedHotspotId: number | null;
  /** A part hotspot was clicked → focus its card. */
  onSelectHotspot: (hotspotId: number) => void;
  /** A navigation hotspot was clicked → drill to its target drawing. */
  onNavigate: (drawingId: number) => void;
  labels?: SplLabels;
}

/**
 * Middle column. Injects the SPL SVG verbatim (the position numbers are baked
 * into the drawing bitmap; the `.pcg_hotspot` rects are transparent click
 * targets), wires pan/zoom via `@panzoom/panzoom`, and routes hotspot clicks.
 *
 * The SVG comes from the trusted SpareParts Live API through the host's server
 * proxy and is injected as-is — same as the WP reference; no sanitizer, which
 * would strip the SVG structure it needs.
 *
 * Selection is imperative: an effect toggles `.spl-active` on the one matching
 * `.pcg_hotspot` rather than re-parsing the (large) SVG. Click/hover listeners
 * are bound once per SVG injection and read the current nav/callbacks from a
 * ref, so selection changes never re-bind them.
 */
export function DrawingCanvas({
  svg,
  nav,
  selectedHotspotId,
  onSelectHotspot,
  onNavigate,
  labels,
}: DrawingCanvasProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const panzoomRef = useRef<PanzoomObject | null>(null);
  const latest = useRef({ nav, onSelectHotspot, onNavigate });
  latest.current = { nav, onSelectHotspot, onNavigate };

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    host.innerHTML = svg || '';
    const svgEl = host.querySelector<SVGSVGElement>('#svgRoot');
    if (!svgEl) return;

    const cleanups: Array<() => void> = [];

    const spots = Array.from(host.querySelectorAll<SVGElement>('.pcg_hotspot'));
    for (const spot of spots) {
      const num = Number.parseInt((spot.id || '').replace(/^hs/, ''), 10);
      if (!Number.isFinite(num)) continue;
      spot.setAttribute('data-hotspot-id', String(num));

      const onClick = (e: Event) => {
        e.stopPropagation();
        const state = latest.current;
        const target = state.nav[String(num)];
        if (typeof target === 'number') state.onNavigate(target);
        else state.onSelectHotspot(num);
      };
      const onEnter = () => spot.classList.add('spl-hover');
      const onLeave = () => spot.classList.remove('spl-hover');
      spot.addEventListener('click', onClick);
      spot.addEventListener('mouseenter', onEnter);
      spot.addEventListener('mouseleave', onLeave);
      cleanups.push(() => {
        spot.removeEventListener('click', onClick);
        spot.removeEventListener('mouseenter', onEnter);
        spot.removeEventListener('mouseleave', onLeave);
      });
    }

    const pz = Panzoom(svgEl, { maxScale: 8, minScale: 0.5, cursor: 'grab' });
    panzoomRef.current = pz;
    const onWheel = (e: WheelEvent) => pz.zoomWithWheel(e);
    host.addEventListener('wheel', onWheel, { passive: false });
    cleanups.push(() => {
      host.removeEventListener('wheel', onWheel);
      pz.destroy();
      panzoomRef.current = null;
    });

    return () => {
      for (const c of cleanups) c();
      host.innerHTML = '';
    };
  }, [svg]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    host
      .querySelectorAll('.pcg_hotspot.spl-active')
      .forEach((el) => el.classList.remove('spl-active'));
    if (selectedHotspotId != null) {
      host
        .querySelector(`.pcg_hotspot[data-hotspot-id="${selectedHotspotId}"]`)
        ?.classList.add('spl-active');
    }
  }, [selectedHotspotId, svg]);

  return (
    <div className="spl-canvas">
      <div className="spl-canvas__controls" role="group" aria-label="Zoom">
        <button type="button" onClick={() => panzoomRef.current?.zoomIn()} aria-label={labels?.zoomIn ?? 'Zoom in'}>
          +
        </button>
        <button type="button" onClick={() => panzoomRef.current?.zoomOut()} aria-label={labels?.zoomOut ?? 'Zoom out'}>
          −
        </button>
        <button type="button" onClick={() => panzoomRef.current?.reset()} aria-label={labels?.zoomReset ?? 'Reset'}>
          ⟲
        </button>
      </div>
      <div ref={hostRef} className="spl-canvas__stage" />
    </div>
  );
}
