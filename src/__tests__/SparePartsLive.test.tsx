import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { SWRConfig } from 'swr';
import { SparePartsLive } from '../react/SparePartsLive';

const rootPayload = {
  tree: [{ id: 1, name: 'Root', parent: -1 }],
  drawing: '',
  cards: [],
  nav: {},
};

describe('<SparePartsLive>', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => rootPayload }) as unknown as Response)
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('renders the heading and fetches the root drawings', async () => {
    render(
      // fresh SWR cache so the test is isolated
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
        <SparePartsLive publicationId="123" />
      </SWRConfig>
    );

    expect(screen.getByText('Find your parts')).toBeTruthy();
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith('/api/spl/drawings?publicationId=123')
    );
  });
});
