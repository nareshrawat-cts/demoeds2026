/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-fullscreen. Base block: hero.
 * Source: https://wknd-adventures.com/index.html
 * Generated: 2026-07-17
 *
 * Structure (from library-description.txt): 1 column.
 * Row 2 (optional): background image.
 * Row 3: content cell — eyebrow tag, heading, lead paragraph, CTA links.
 * Source: .hero-section--full with .hero-bg > img and .hero-content
 * (.tag, h1, .hero-lead, .button-group > a).
 *
 * Fixes:
 *  - Wrap the .hero-bg background <img> in a <p> so it is not dropped by the converter
 *    (previously the first cell rendered empty).
 *  - Emit each CTA as a standalone <p><a>label</a></p> so EDS creates a button-container
 *    and the block JS decorates them into primary / ghost buttons.
 *  - Normalize the background image src to an absolute URL so the importer's image-adjust
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

  const content = element.querySelector('.hero-content-inner, .hero-content, .container') || element;

  // Background image (inside .hero-bg). Wrap so the bare <img> survives conversion.
  const bgImage = element.querySelector('.hero-bg img, img[class*="background"], picture img, img');
  absolutize(bgImage);

  const tag = content.querySelector('.tag, [class*="tag"]');
  const heading = content.querySelector('h1, h2, h3, .h1-heading, [class*="heading"]');
  const subheading = content.querySelector('.hero-lead, .paragraph-xl, p:not(.tag)');
  const ctaLinks = Array.from(content.querySelectorAll('.button-group a, a.accent-button, a.button--ghost, a[class*="button"]'));

  // Empty-block guard.
  if (!heading && !subheading && ctaLinks.length === 0 && !bgImage) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  // Row 2: background image, wrapped in a <p>.
  if (bgImage) {
    const imgPara = document.createElement('p');
    imgPara.append(bgImage);
    cells.push([imgPara]);
  }

  // Row 3: content cell with tag, heading, lead, and CTA buttons.
  const contentCell = [];
  if (tag) contentCell.push(tag);
  if (heading) contentCell.push(heading);
  if (subheading && subheading !== tag) contentCell.push(subheading);

  // Rebuild each CTA as a clean standalone <p><a>label</a></p> (drops inner <span>),
  // so EDS decorates it as a button-container / a.button.
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

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-fullscreen', cells });
  element.replaceWith(block);
}
