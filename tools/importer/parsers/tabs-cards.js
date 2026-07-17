/* eslint-disable */
/* global WebImporter */
/**
 * Parser for tabs-cards. Base block: tabs.
 * Source: https://wknd-adventures.com/index.html
 * Generated: 2026-07-17
 *
 * Structure (from library-description.txt): 2 columns.
 * Row 1: block name. Each subsequent row = [tab label, tab content].
 * Source: .tab-menu > .tab-menu-link buttons (labels) paired by order with .tab-pane panels
 * (content). Each pane holds a grid of .article-card links.
 */
export default function parse(element, { document }) {
  const labels = Array.from(element.querySelectorAll('.tab-menu .tab-menu-link, .tab-menu button, [class*="tab-menu-link"]'));
  const panes = Array.from(element.querySelectorAll('.tab-pane, [class*="tab-pane"]'));

  // Empty-block guard.
  if (panes.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  panes.forEach((pane, i) => {
    // Label cell: match by order; fall back to the pane id when no button exists.
    const labelEl = labels[i];
    const labelCell = document.createElement('p');
    if (labelEl) {
      labelCell.textContent = (labelEl.textContent || '').trim();
    } else if (pane.id) {
      labelCell.textContent = pane.id.replace(/^tab-/, '').replace(/-/g, ' ');
    }

    // Content cell: the inner grid of the pane, or the pane itself.
    const contentEl = pane.querySelector('.grid-layout, .grid, :scope > div') || pane;

    cells.push([labelCell, contentEl]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-cards', cells });
  element.replaceWith(block);
}
