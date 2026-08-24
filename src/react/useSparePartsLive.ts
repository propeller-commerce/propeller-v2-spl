import { useCallback, useMemo, useState } from 'react';
import useSWR from 'swr';
import type {
  SplDrawingNode,
  SparePartCard,
  SplRootResult,
  SplDrawingResult,
} from '../types';
import { findNode, breadcrumbTrail } from '../tree';

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body && typeof body.error === 'string') msg = body.error;
    } catch {
      /* non-JSON error body — keep the status message */
    }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export interface UseSparePartsLive {
  tree: SplDrawingNode[];
  /** The node whose level the left list shows (may differ from the active drawing). */
  listNode: SplDrawingNode | null;
  breadcrumbs: SplDrawingNode[];
  svg: string;
  cards: SparePartCard[];
  /** hotspot id → target drawing id, for navigation hotspots. */
  nav: Record<string, number>;
  activeDrawingId: number | null;
  selectedHotspotId: number | null;
  setSelectedHotspotId: (id: number | null) => void;
  loadDrawing: (id: number) => void;
  loading: boolean;
  error: Error | undefined;
}

/**
 * Owns SPL navigation state and fetches drawings via SWR keyed by URL — SWR
 * gives request dedup, a per-drawing cache (drill-back-up is instant) and
 * built-in race handling, so there's no hand-rolled inflight guard.
 *
 * The root call (`/drawings`) returns the tree + the root drawing + its cards;
 * drill-downs (`/drawing?id=`) return just that drawing's SVG + cards. The tree
 * is kept from the root call and reused for the left list + breadcrumbs.
 */
export function useSparePartsLive(
  publicationId: string | number,
  apiBase: string
): UseSparePartsLive {
  const [activeDrawingId, setActiveDrawingId] = useState<number | null>(null);
  const [listNodeId, setListNodeId] = useState<number | null>(null);
  const [selectedHotspotId, setSelectedHotspotId] = useState<number | null>(null);

  const hasPub = publicationId !== '' && publicationId != null;
  const rootKey = hasPub
    ? `${apiBase}/drawings?publicationId=${encodeURIComponent(String(publicationId))}`
    : null;
  const {
    data: root,
    error: rootError,
    isLoading: rootLoading,
  } = useSWR<SplRootResult>(rootKey, fetchJson);

  const tree = root?.tree ?? [];
  const rootId = tree[0]?.id ?? null;
  const effectiveDrawingId = activeDrawingId ?? rootId;
  const isRoot =
    effectiveDrawingId != null && rootId != null && effectiveDrawingId === rootId;

  const drawingKey =
    effectiveDrawingId != null && !isRoot
      ? `${apiBase}/drawing?id=${effectiveDrawingId}`
      : null;
  const {
    data: drawingData,
    error: drawingError,
    isLoading: drawingLoading,
  } = useSWR<SplDrawingResult>(drawingKey, fetchJson);

  const current =
    isRoot || effectiveDrawingId == null
      ? { drawing: root?.drawing ?? '', cards: root?.cards ?? [], nav: root?.nav ?? {} }
      : drawingData ?? { drawing: '', cards: [] as SparePartCard[], nav: {} };

  const listNode = useMemo(() => {
    const id = listNodeId ?? rootId;
    return id != null ? findNode(tree, id) : null;
  }, [tree, listNodeId, rootId]);

  const breadcrumbs = useMemo(
    () => (effectiveDrawingId != null ? breadcrumbTrail(tree, effectiveDrawingId) : []),
    [tree, effectiveDrawingId]
  );

  const loadDrawing = useCallback(
    (id: number) => {
      setSelectedHotspotId(null);
      setActiveDrawingId(id);
      // Branch → drill the list into it; leaf → keep the current list level
      // (mirrors WP: the list is only redrawn when the drawing has children).
      const node = findNode(tree, id);
      if (node?.children?.length) setListNodeId(id);
    },
    [tree]
  );

  const loading = rootLoading || (drawingKey != null && drawingLoading && !drawingData);
  const error =
    (rootError as Error | undefined) ??
    (drawingKey != null ? (drawingError as Error | undefined) : undefined);

  return {
    tree,
    listNode,
    breadcrumbs,
    svg: current.drawing,
    cards: current.cards,
    nav: current.nav,
    activeDrawingId: effectiveDrawingId,
    selectedHotspotId,
    setSelectedHotspotId,
    loadDrawing,
    loading,
    error,
  };
}
