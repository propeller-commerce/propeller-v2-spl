// Copies the hand-written stylesheet to dist for the `./styles.css` export.
// Plain CSS (no Tailwind build) so the package is self-contained — consumers
// import it once and get the panel styling regardless of their CSS stack.
import { copyFileSync, mkdirSync } from 'node:fs';

mkdirSync('dist', { recursive: true });
copyFileSync('src/styles.css', 'dist/styles.css');
console.log('[spl] copied src/styles.css -> dist/styles.css');
