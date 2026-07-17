/* eslint-disable */
/* global WebImporter */
/**
 * Parser for accordion-faq. Base block: accordion.
 * Source: https://wknd-adventures.com/index.html
 * Generated: 2026-07-17
 *
 * Structure (from library-description.txt): 2 columns.
 * Row 1: block name. Each subsequent row = [title cell, content cell].
 * Source: .faq-list > .faq-item, each with .faq-question (title) and .faq-answer (content).
 *
 * Each row must have exactly 2 cells — [question, answer] — so the block JS can build
 * the toggle button from the question cell and reveal the answer cell. We emit the
 * question as its own paragraph and the answer text as a separate paragraph so both are
 * preserved as distinct cells per item.
 */
export default function parse(element, { document }) {
  // Direct .faq-item children of the list; fall back to any descendant .faq-item.
  let items = Array.from(element.querySelectorAll(':scope > .faq-item'));
  if (items.length === 0) {
    items = Array.from(element.querySelectorAll('.faq-item, [class*="faq-item"]'));
  }

  const cells = [];

  items.forEach((item) => {
    // Title: prefer the inner text span of the question button, fall back to the button/heading.
    const questionEl = item.querySelector('.faq-question span:not(.faq-icon), .faq-question, h2, h3, [class*="question"]');
    const answerEl = item.querySelector('.faq-answer, [class*="answer"], .faq-content');

    // Skip malformed items with neither a title nor content.
    if (!questionEl && !answerEl) return;

    // Question cell: plain text in its own paragraph.
    const titleText = questionEl ? (questionEl.textContent || '').trim() : '';
    const titleCell = document.createElement('p');
    titleCell.textContent = titleText;

    // Answer cell: preserve the answer text in a paragraph so the cell is never empty.
    const answerText = answerEl ? (answerEl.textContent || '').trim() : '';
    const contentCell = document.createElement('p');
    contentCell.textContent = answerText;

    cells.push([titleCell, contentCell]);
  });

  // Empty-block guard: nothing extracted.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion-faq', cells });
  element.replaceWith(block);
}
