import { defineConfig } from 'tsup';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Two entry points — the split keeps the SDK + server code out of the client
 * bundle (a single barrel would drag `@propeller-commerce/propeller-sdk-v2`
 * into every PDP that imports the panel):
 *
 *   - `src/index.ts`        → React client surface (the `<SparePartsLive>`
 *                             panel + hooks). Gets a `"use client"` banner
 *                             (see `onSuccess`). Imports React, swr,
 *                             @panzoom/panzoom, and TYPE-ONLY from the SDK.
 *   - `src/server/index.ts` → framework-agnostic server helpers (SPL API
 *                             client, tree/hotspot parsing, product
 *                             resolution, drawing assembly). The only entry
 *                             that touches the SDK at runtime. NO banner.
 *
 * The banner is prepended post-build (not via tsup's `banner`) because esbuild
 * strips module-level "use client" directives during bundling
 * (https://github.com/evanw/esbuild/issues/2840). Same approach as
 * propeller-v2-react-ui.
 */
function prependUseClient(filePath: string): void {
  if (!existsSync(filePath)) return;
  const original = readFileSync(filePath, 'utf8');
  const directive = '"use client";\n';
  if (original.startsWith(directive)) return;
  writeFileSync(filePath, directive + original, 'utf8');
}

const EXTERNAL = [
  'react',
  'react-dom',
  'react/jsx-runtime',
  'swr',
  '@panzoom/panzoom',
  '@propeller-commerce/propeller-sdk-v2',
];

export default defineConfig([
  {
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    splitting: false,
    treeshake: true,
    external: EXTERNAL,
    esbuildOptions(options) {
      options.jsx = 'automatic';
    },
    async onSuccess() {
      const distDir = join(process.cwd(), 'dist');
      prependUseClient(join(distDir, 'index.js'));
      prependUseClient(join(distDir, 'index.cjs'));
    },
  },
  {
    entry: { server: 'src/server/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: false,
    splitting: false,
    treeshake: true,
    external: EXTERNAL,
  },
]);
