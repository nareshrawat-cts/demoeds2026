/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-cta. Base block: hero.
 * Source: https://wknd-adventures.com/index.html
 * Generated: 2026-07-17
 *
 * Structure (from library-description.txt): 1 column.
 * Row 2 (optional): background image.
 * Row 3: title (heading), subheading, call-to-action(s).
 * Source: .accent-section with heading, paragraph, and .button-group links. No bg image present.
 *
 * Fix: emit each CTA as a standalone <p><a>label</a></p> so EDS creates a
 * .button-container / a.button that the block JS decorates into primary / secondary
 * buttons (previously the raw <a> nodes were not wrapped and were not decorated).
 */
export default function parse(element, { document }) {
  const container = element.querySelector('.container') || element;

  const bgImage = element.querySelector('img[class*="background"], img[class*="hero"], picture img, img');
  const heading = container.querySelector('h1, h2, h3, .h2-heading, [class*="heading"]');
  const subheading = container.querySelector('.paragraph-lg, p:not(.tag)');
  const ctaLinks = Array.from(container.querySelectorAll('.button-group a, a.button, a.button--ghost, a[class*="button"]'));

  // Empty-block guard.
  if (!heading && !subheading && ctaLinks.length === 0 && !bgImage) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  // Row 2: optional background image (only add when present). Wrap so it survives conversion.
  if (bgImage) {
    const imgPara = document.createElement('p');
    imgPara.append(bgImage);
    cells.push([imgPara]);
  }

  // Row 3: content cell holding title, subheading, and CTA buttons.
  const contentCell = [];
  if (heading) contentCell.push(heading);
  if (subheading && subheading !== heading) contentCell.push(subheading);

  // Rebuild each CTA as a standalone <p><a>label</a></p> (drops inner <span>).
  ctaLinks.forEach((cta) => {
    const label = (cta.textContent || '').trim();
    if (!label) return;
    const link = document.createElement('a');
    link.setAttribute('href', cta.getAttribute('href') || '');
    link.textContent = label;
    const para = document.createElement('p');
    para.append(link);
    contentCell.push(para);
  });

  cells.push([contentCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-cta', cells });
  element.replaceWith(block);
}
