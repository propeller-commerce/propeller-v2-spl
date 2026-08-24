import type { SplDrawingNode } from '../types';

export interface DrawingTreeProps {
  /** The node whose level is shown: a header row + its direct children. */
  listNode: SplDrawingNode | null;
  activeDrawingId: number | null;
  onSelect: (id: number) => void;
}

/**
 * Left column. Ports `Helper.draw_tree`: a header row for the current node
 * (a ← back affordance when it has a parent) followed by its direct children
 * (→ when a child has its own children). Clicking navigates.
 */
export function DrawingTree({ listNode, activeDrawingId, onSelect }: DrawingTreeProps) {
  if (!listNode) return null;

  const hasParent = typeof listNode.parent === 'number' && listNode.parent > 0;
  const backTarget = hasParent ? listNode.parent : listNode.id;
  const children = listNode.children ?? [];

  return (
    <nav className="spl-tree" aria-label="Spare part drawings">
      <button
        type="button"
        className="spl-tree__item spl-tree__item--header"
        onClick={() => onSelect(backTarget)}
      >
        {hasParent ? <span className="spl-tree__back" aria-hidden>←</span> : null}
        <span className="spl-tree__label">{listNode.name}</span>
      </button>

      {children.map((child) => {
        const drillable = !!child.children?.length;
        const active = child.id === activeDrawingId;
        return (
          <button
            key={child.id}
            type="button"
            className={
              'spl-tree__item spl-tree__item--child' + (active ? ' spl-tree__item--active' : '')
            }
            onClick={() => onSelect(child.id)}
          >
            <span className="spl-tree__label">- {child.name}</span>
            {drillable ? <span className="spl-tree__arrow" aria-hidden>→</span> : null}
          </button>
        );
      })}
    </nav>
  );
}
