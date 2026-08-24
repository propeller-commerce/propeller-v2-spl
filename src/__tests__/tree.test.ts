import { describe, it, expect } from 'vitest';
import { buildTree, findNode, breadcrumbTrail } from '../tree';
import type { SplDrawingNode } from '../types';

const flat: SplDrawingNode[] = [
  { id: 1, name: 'Root', parent: -1 },
  { id: 2, name: 'Cabin', parent: 1 },
  { id: 3, name: 'Operator control', parent: 2 },
  { id: 4, name: 'Chassis', parent: 1 },
  { id: 99, name: 'Orphan', parent: 555 },
];

describe('buildTree', () => {
  it('nests by parent with -1 as root', () => {
    const tree = buildTree(flat);
    // Root + promoted orphan
    expect(tree.map((n) => n.id).sort()).toEqual([1, 99]);
    const root = tree.find((n) => n.id === 1)!;
    expect(root.children?.map((c) => c.id)).toEqual([2, 4]);
    const cabin = root.children!.find((c) => c.id === 2)!;
    expect(cabin.children?.map((c) => c.id)).toEqual([3]);
  });

  it('returns empty for empty input', () => {
    expect(buildTree([])).toEqual([]);
  });
});

describe('findNode', () => {
  it('finds nested nodes', () => {
    const tree = buildTree(flat);
    expect(findNode(tree, 3)?.name).toBe('Operator control');
    expect(findNode(tree, 404)).toBeNull();
  });
});

describe('breadcrumbTrail', () => {
  it('returns root→node path', () => {
    const tree = buildTree(flat);
    expect(breadcrumbTrail(tree, 3).map((n) => n.id)).toEqual([1, 2, 3]);
    expect(breadcrumbTrail(tree, 1).map((n) => n.id)).toEqual([1]);
    expect(breadcrumbTrail(tree, 404)).toEqual([]);
  });
});
