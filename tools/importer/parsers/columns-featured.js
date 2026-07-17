/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-featured. Base block: columns.
 * Source: https://wknd-adventures.com/index.html
 * Generated: 2026-07-17
 *
 * Structure (from library-description.txt): columns follow the natural visual grouping.
 * Source: .featured-article contains an image column (.featured-article-image) and a
 * text column (tag, heading, paragraph, "Read the Story" CTA). => 2 columns, one row.
 *
 * Fixes:
 *  - Wrap the featured image in a <p> so the bare <img> is not dropped by the converter.
 *  - Emit the "Read the Story" link as a standalone <p><strong><a>…</a></strong></p> so
 *    EDS auto-decorates it into a primary button (a.button / .button-container), which the
 *    block CSS styles.
 *  - Normalize the featured image src to an absolute URL so the importer's image-adjust
 *    step can resolve and download it (relative src without a leading slash was dropped).
 */
export default function parse(element, { document, url }) {
  // Resolve a possibly-relative img src against the page URL so the importer can download it.
  const absolutize = (img) => {
    if (!img) return;
    const src = img.getAttribute('src');
    if (!src) return;
    try {
      const base = url || document.baseURI;
      img.setAttribute('src', new URL(src, base).href);
    } catch (e) {
      /* leave src unchanged if it cannot be resolved */
    }
  };

  // The element may be the section wrapper; drill down to the featured-article container.
  const article = element.querySelector('.featured-article') || element;

  // Column 1: the image, wrapped so it survives markdown conversion.
  const imageWrap = article.querySelector('.featured-article-image');
  const image = (imageWrap && imageWrap.querySelector('img')) || article.querySelector('img');
  absolutize(image);
  let imageCell = '';
  if (image) {
    imageCell = document.createElement('p');
    imageCell.append(image);
  }

  // Column 2: the text content (tag, heading, description, CTA button).
  const textCell = [];
  const tag = article.querySelector('.tag, [class*="tag"]');
  const heading = article.querySelector('h1, h2, h3, .h2-heading, [class*="heading"]');
  const description = article.querySelector('.paragraph-lg, p.utility-text-secondary, p:not(.tag)');
  const cta = article.querySelector('.featured-article-footer a, a.button, a[href]');

  if (tag) textCell.push(tag);
  if (heading) textCell.push(heading);
  if (description && description !== tag) textCell.push(description);

  if (cta) {
    // Mark the CTA as a primary button: <p><strong><a>label</a></strong></p>.
    const label = (cta.textContent || '').trim();
    const link = document.createElement('a');
    link.setAttribute('href', cta.getAttribute('href') || '');
    link.textContent = label;
    const strong = document.createElement('strong');
    strong.append(link);
    const buttonPara = document.createElement('p');
    buttonPara.append(strong);
    textCell.push(buttonPara);
  }

  // Empty-block guard.
  if (!image && textCell.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  cells.push([imageCell, textCell.length ? textCell : '']);

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-featured', cells });
  element.replaceWith(block);
}
