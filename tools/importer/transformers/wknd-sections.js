/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: WKND Adventures section breaks + section metadata.
 *
 * Driven by payload.template.sections (page-templates.json). Emits one EDS
 * section per source section: an <hr> before every non-first section, and a
 * "Section Metadata" block (Style row) at the end of every styled section
 * (secondary / inverse / accent).
 *
 * Why two hooks (marker strategy):
 *   The block parsers run BETWEEN beforeTransform and afterTransform, and
 *   several of them call `element.replaceWith(block)` on the *section element
 *   itself* (hero-fullscreen, columns-featured, ticker-strip, hero-cta). By the
 *   time afterTransform runs, those <section> wrappers no longer exist and the
 *   `:nth-of-type` chain in the template selectors is broken — so resolving the
 *   section selectors in afterTransform (as the previous version did) found
 *   almost nothing, collapsing 9 sections into a handful with no breaks.
 *
 *   To survive parser DOM replacement we resolve each section selector in
 *   beforeTransform (structure still intact) and drop a lightweight *marker*
 *   element immediately BEFORE each section. `replaceWith` on a section never
 *   touches its preceding sibling, so the markers persist. In afterTransform we
 *   walk the markers in document order to place <hr> breaks and Section Metadata
 *   blocks, then remove the markers.
 *
 * Selectors come from the template (validated against migration-work/cleaned.html):
 *   main#main-content direct children, in order — hero, featured-article
 *   (secondary), browse-by-activity, ticker-strip, start-here (inverse),
 *   quick-answers, how-we-work (secondary), in-the-field (inverse), cta (accent).
 *
 * The transformer runs against `element` = document.body (see import-homepage.js),
 * so the template's `#main-content > …` selectors resolve as body descendants.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };
const MARKER_ATTR = 'data-wknd-section';

function getSections(payload) {
  const template = payload && payload.template;
  const sections = template && Array.isArray(template.sections) ? template.sections : [];
  return sections;
}

export default function transform(hookName, element, payload) {
  const sections = getSections(payload);
  if (sections.length < 2) return;

  const doc = element.ownerDocument || document;

  if (hookName === TransformHook.beforeTransform) {
    // Structure is still intact here (parsers have not run). Anchor each section
    // with a marker placed as its preceding sibling so parser replaceWith() on
    // the section itself cannot destroy the anchor.
    sections.forEach((section, i) => {
      if (!section || !section.selector) return;
      const sectionEl = element.querySelector(section.selector);
      if (!sectionEl || !sectionEl.parentNode) return;

      const marker = doc.createElement('div');
      marker.setAttribute(MARKER_ATTR, String(i));
      if (section.style) marker.setAttribute('data-wknd-style', section.style);
      sectionEl.parentNode.insertBefore(marker, sectionEl);
    });
    return;
  }

  if (hookName === TransformHook.afterTransform) {
    // Markers now sit immediately before each (possibly transformed) section's
    // content, in document order. Walk them to insert breaks + metadata.
    const markers = Array.from(element.querySelectorAll(`[${MARKER_ATTR}]`))
      .sort((a, b) => Number(a.getAttribute(MARKER_ATTR)) - Number(b.getAttribute(MARKER_ATTR)));

    markers.forEach((marker, idx) => {
      const style = marker.getAttribute('data-wknd-style');
      const isFirst = idx === 0;
      const nextMarker = markers[idx + 1] || null;

      // Section break before every non-first section (placed where the marker is).
      if (!isFirst) {
        marker.parentNode.insertBefore(doc.createElement('hr'), marker);
      }

      // Section Metadata for styled sections: place at the END of this section,
      // i.e. right before the next section's marker (or appended to the parent
      // for the last section).
      if (style) {
        const metaBlock = WebImporter.Blocks.createBlock(doc, {
          name: 'Section Metadata',
          cells: { Style: style },
        });
        if (nextMarker && nextMarker.parentNode === marker.parentNode) {
          marker.parentNode.insertBefore(metaBlock, nextMarker);
        } else {
          marker.parentNode.appendChild(metaBlock);
        }
      }

      // Remove the marker; it has served its purpose.
      marker.remove();
    });
  }
}
