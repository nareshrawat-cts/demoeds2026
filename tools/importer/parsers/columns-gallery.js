/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-gallery. Base block: columns.
 * Source: https://wknd-adventures.com/index.html
 * Generated: 2026-07-17
 *
 * Structure (from library-description.txt): flexible columns following the natural
 * visual grouping. The source grid presents gallery images side by side, so we emit
 * one content row with one column per image.
 *
 * Fixes:
 *  - The previous version referenced the bare <img> nodes directly, which the
 *    downstream markdown converter dropped (empty cells → 0 images). We now wrap each
 *    image in its own container element so every image survives into the block table.
 *  - Normalize each image src to an absolute URL so the importer's image-adjust step can
 *    resolve and download it (relative src without a leading slash was dropped).
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

  // Collect the gallery images. Prefer direct children, then any descendant
  // gallery images, then any descendant <img> as a last resort.
  let images = Array.from(element.querySelectorAll(':scope > img.gallery-img'));
  if (images.length === 0) {
    images = Array.from(element.querySelectorAll('img.gallery-img'));
  }
  if (images.length === 0) {
    images = Array.from(element.querySelectorAll('img'));
  }

  // Empty-block guard.
  if (images.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // One content row: each image gets its own column. Wrap each <img> in a
  // paragraph so the converter reliably emits the image node.
  const row = images.map((img) => {
    absolutize(img);
    const cell = document.createElement('p');
    cell.append(img);
    return cell;
  });

  const cells = [row];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-gallery', cells });
  element.replaceWith(block);
}
