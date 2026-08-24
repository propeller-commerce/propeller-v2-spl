/**
 * Pure drawing-tree helpers (no SDK, no React) — used by the server assembly
 * AND the client hook, so they live at the package root, importable from both
 * entries without leaking server/SDK code into the client bundle.
 */
import type { SplDrawingNode } from './types';

/**
 * Nest the flat `getDrawingTree` list by `parent` (`-1` = root). Orphans
 * (parent id not present) are promoted to roots so nothing is dropped.
 * Ports `Helper.get_tree` from the WP plugin.
 */
export function buildTree(flat: SplDrawingNode[]): SplDrawingNode[] {
  const byId = new Map<number, SplDrawingNode>();
  for (const item of flat) byId.set(item.id, { ...item, children: [] });

  const roots: SplDrawingNode[] = [];
  for (const item of flat) {
    const node = byId.get(item.id)!;
    if (item.parent === -1) {
      roots.push(node);
      continue;
    }
    const parent = byId.get(item.parent);
    if (parent) parent.children!.push(node);
    else roots.push(node);
  }
  return roots;
}

/** Depth-first search for a node by id in a nested tree. */
export function findNode(nodes: SplDrawingNode[], id: number): SplDrawingNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children?.length) {
      const found = findNode(n.children, id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Root→node path for breadcrumbs. Walks the nested tree, accumulating the path;
 * returns `[]` when the id isn't found. Ports `set_breadcrumbs`.
 */
export function breadcrumbTrail(nodes: SplDrawingNode[], id: number): SplDrawingNode[] {
  for (const n of nodes) {
    if (n.id === id) return [n];
    if (n.children?.length) {
      const childPath = breadcrumbTrail(n.children, id);
      if (childPath.length) return [n, ...childPath];
    }
  }
  return [];
}
