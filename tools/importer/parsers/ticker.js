/* eslint-disable */
/* global WebImporter */
/**
 * Parser for ticker. Custom block (not in library catalog) — structure inferred from source HTML.
 * Source: https://wknd-adventures.com/index.html
 * Generated: 2026-07-17
 *
 * Source: .ticker-strip > .ticker-track holds a marquee of <span> terms separated by
 * <span class="ticker-sep">. The sequence is duplicated to enable seamless scrolling.
 * Mapping: 1-column block whose single content cell lists the unique ordered terms.
 *
 * Fix: the previous extraction used an overlapping selector list
 * (':scope > span:not(.ticker-sep), span:not(.ticker-sep)') that could yield zero terms
 * at import time. We now grab all descendant <span> nodes, filter out separators by
 * class, and fall back to the .ticker-strip element itself when .ticker-track is absent.
 */
export default function parse(element, { document }) {
  // Prefer the inner track; fall back to the strip element itself if it is absent
  // (keywords may be direct children of .ticker-strip).
  const track = element.querySelector('.ticker-track') || element;

  // Grab every descendant <span>, then drop the separator spans by class.
  const termSpans = Array.from(track.querySelectorAll('span'))
    .filter((s) => !s.classList.contains('ticker-sep'));
  let terms = termSpans
    .map((s) => (s.textContent || '').trim())
    .filter((t) => t.length > 0);

  // Fallback: the importer may strip the aria-hidden span subtree before the
  // parser runs, leaving only text. Recover terms by splitting the element's
  // text content on the middot separators.
  if (terms.length === 0) {
    terms = (track.textContent || '')
      .split(/[·•|]/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
  }

  // The marquee duplicates the full sequence; keep only the first half if it is an exact repeat.
  if (terms.length > 1 && terms.length % 2 === 0) {
    const half = terms.length / 2;
    const first = terms.slice(0, half);
    const second = terms.slice(half);
    if (first.join('|') === second.join('|')) {
      terms = first;
    }
  }

  // Empty-block guard.
  if (terms.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const contentCell = document.createElement('p');
  contentCell.textContent = terms.join(', ');

  const cells = [[contentCell]];

  const block = WebImporter.Blocks.createBlock(document, { name: 'ticker', cells });
  element.replaceWith(block);
}
