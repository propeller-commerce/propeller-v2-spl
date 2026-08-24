import type { SparePartCard } from '../types';

export interface InfoRequestContext {
  /** Recipient (the configured SPL contact email). */
  contactEmail?: string;
  /** The host product the drawing belongs to (the PDP product). */
  hostProductName?: string;
  hostProductSku?: string;
  /** Drawing path names, root → current. */
  breadcrumb?: string[];
  card: SparePartCard;
}

/**
 * Build a prefilled `mailto:` for a "not found" part's information request —
 * the standalone analog of the WP contact modal / email. The recipient goes in
 * the scheme part raw (encoding `@` breaks some clients); subject + body are
 * percent-encoded.
 */
export function buildInfoRequestMailto(ctx: InfoRequestContext): string {
  const to = ctx.contactEmail ?? '';
  const subject = `Information request: ${ctx.card.name} (${ctx.card.sku})`;
  const lines = [
    'I would like more information about the following spare part:',
    '',
    `Part: ${ctx.card.name}`,
    `SKU: ${ctx.card.sku}`,
    `Position: ${ctx.card.pos}`,
  ];
  if (ctx.breadcrumb && ctx.breadcrumb.length) {
    lines.push(`Drawing: ${ctx.breadcrumb.join(' » ')}`);
  }
  if (ctx.hostProductName) {
    lines.push(
      '',
      `Machine / product: ${ctx.hostProductName}${ctx.hostProductSku ? ` (${ctx.hostProductSku})` : ''}`
    );
  }
  const query = `subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
  return `mailto:${to}?${query}`;
}
