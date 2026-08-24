/**
 * SpareParts Live HTTP client (framework-agnostic). Three GET endpoints, token
 * in the query string. `fetch` is injectable so a host can pass a caching
 * `fetch` — the tree/drawing responses are viewer-independent.
 *
 * Ports `PropellerSparepartsUrls` + `PropellerSparepartsHttp`.
 */
import type { SplDrawingTreeResponse, SplHotspotsResponse } from '../types';

export interface SplClientConfig {
  /** e.g. `https://api.spareparts.live/v1` (no trailing slash required). */
  baseUrl: string;
  /** SPL API token — server-side secret. */
  token: string;
  /** Override the fetch implementation (default: global `fetch`). */
  fetch?: typeof fetch;
}

export interface SplClient {
  getDrawingTree(publicationId: string | number): Promise<SplDrawingTreeResponse>;
  getDrawing(drawingId: string | number): Promise<string>;
  getHotspots(drawingId: string | number): Promise<SplHotspotsResponse>;
}

export function createSplClient(config: SplClientConfig): SplClient {
  const doFetch = config.fetch ?? fetch;
  const base = config.baseUrl.replace(/\/+$/, '');
  const token = encodeURIComponent(config.token);
  const q = (v: string | number) => encodeURIComponent(String(v));

  async function getText(url: string, what: string): Promise<string> {
    const res = await doFetch(url);
    if (!res.ok) throw new Error(`SPL ${what} failed: HTTP ${res.status}`);
    return res.text();
  }
  async function getJson<T>(url: string, what: string): Promise<T> {
    const res = await doFetch(url);
    if (!res.ok) throw new Error(`SPL ${what} failed: HTTP ${res.status}`);
    return res.json() as Promise<T>;
  }

  return {
    getDrawingTree(publicationId) {
      return getJson<SplDrawingTreeResponse>(
        `${base}/getDrawingTree.php?token=${token}&pubid=${q(publicationId)}`,
        'getDrawingTree'
      );
    },
    getDrawing(drawingId) {
      return getText(`${base}/getDrawing.php?token=${token}&id=${q(drawingId)}`, 'getDrawing');
    },
    getHotspots(drawingId) {
      return getJson<SplHotspotsResponse>(
        `${base}/getHotspots.php?token=${token}&id=${q(drawingId)}`,
        'getHotspots'
      );
    },
  };
}
