/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: WKND Adventures site-wide cleanup.
 * Removes non-authorable global chrome so the import contains only
 * page-level authorable content. Selectors are taken verbatim from the
 * captured DOM in migration-work/cleaned.html.
 *
 * Removed (non-authorable):
 *  - a.skip-link      : "Skip to main content" accessibility anchor (page shell)
 *  - div.navbar       : global navigation / megamenu (auto-populated by header block)
 *  - footer.footer    : global site footer (auto-populated by footer block)
 *  - link, noscript   : leftover non-content elements
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.afterTransform) {
    // Non-authorable global chrome (selectors from captured DOM)
    WebImporter.DOMUtils.remove(element, [
      'a.skip-link',
      'div.navbar',
      'footer.footer',
      'link',
      'noscript',
    ]);
  }
}
