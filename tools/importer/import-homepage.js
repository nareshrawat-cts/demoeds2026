/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import accordionFaqParser from './parsers/accordion-faq.js';
import columnsFeaturedParser from './parsers/columns-featured.js';
import columnsGalleryParser from './parsers/columns-gallery.js';
import heroCtaParser from './parsers/hero-cta.js';
import heroFullscreenParser from './parsers/hero-fullscreen.js';
import tabsCardsParser from './parsers/tabs-cards.js';
import tickerParser from './parsers/ticker.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/wknd-cleanup.js';
import sectionsTransformer from './transformers/wknd-sections.js';

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'homepage',
  description: 'WKND Adventures homepage with hero, featured story, activity tabs, ticker strip, editorial content sections, FAQ, process steps, image gallery, and CTA',
  urls: [
    'https://wknd-adventures.com/index.html',
  ],
  blocks: [
    {
      name: 'hero-fullscreen',
      instances: ['#main-content > section.hero-section.hero-section--full'],
    },
    {
      name: 'columns-featured',
      instances: ['#main-content > section.section.secondary-section:nth-of-type(2)'],
      section: 'secondary',
    },
    {
      name: 'tabs-cards',
      instances: ['#main-content > section.section:nth-of-type(3) > div.container > div.tab-container.tab-container--wide'],
    },
    {
      name: 'ticker',
      instances: ['#main-content > div.ticker-strip'],
    },
    {
      name: 'accordion-faq',
      instances: ['#main-content > section.section:nth-of-type(5) > div.container > div.faq-list'],
    },
    {
      name: 'columns-gallery',
      instances: ['#main-content > section.section.inverse-section:nth-of-type(7) > div.container > div.grid-layout.desktop-3-column.grid-images.grid-gap-lg'],
      section: 'inverse',
    },
    {
      name: 'hero-cta',
      instances: ['#main-content > section.section.accent-section'],
      section: 'accent',
    },
  ],
  sections: [
    { id: 'rc2', name: 'hero', selector: '#main-content > section.hero-section.hero-section--full', style: null, blocks: ['hero-fullscreen'], defaultContent: [] },
    { id: 'rc3', name: 'featured-article', selector: '#main-content > section.section.secondary-section:nth-of-type(2)', style: 'secondary', blocks: ['columns-featured'], defaultContent: [] },
    { id: 'rc4', name: 'browse-by-activity', selector: '#main-content > section.section:nth-of-type(3)', style: null, blocks: ['tabs-cards'], defaultContent: ['#main-content > section.section:nth-of-type(3) > div.container > div.section-heading'] },
    { id: 'rc5', name: 'ticker-strip', selector: '#main-content > div.ticker-strip', style: null, blocks: ['ticker'], defaultContent: [] },
    { id: 'rc6', name: 'start-here', selector: '#main-content > section.section.inverse-section:nth-of-type(4)', style: 'inverse', blocks: [], defaultContent: ['#main-content > section.section.inverse-section:nth-of-type(4) > div.container'] },
    { id: 'rc7', name: 'quick-answers', selector: '#main-content > section.section:nth-of-type(5)', style: null, blocks: ['accordion-faq'], defaultContent: ['#main-content > section.section:nth-of-type(5) > div.container > div.section-heading'] },
    { id: 'rc8', name: 'how-we-work', selector: '#main-content > section.section.secondary-section:nth-of-type(6)', style: 'secondary', blocks: [], defaultContent: ['#main-content > section.section.secondary-section:nth-of-type(6) > div.container'] },
    { id: 'rc9', name: 'in-the-field', selector: '#main-content > section.section.inverse-section:nth-of-type(7)', style: 'inverse', blocks: ['columns-gallery'], defaultContent: ['#main-content > section.section.inverse-section:nth-of-type(7) > div.container > div.section-heading'] },
    { id: 'rc10', name: 'cta', selector: '#main-content > section.section.accent-section', style: 'accent', blocks: ['hero-cta'], defaultContent: [] },
  ],
};

// PARSER REGISTRY
const parsers = {
  'hero-fullscreen': heroFullscreenParser,
  'columns-featured': columnsFeaturedParser,
  'tabs-cards': tabsCardsParser,
  ticker: tickerParser,
  'accordion-faq': accordionFaqParser,
  'columns-gallery': columnsGalleryParser,
  'hero-cta': heroCtaParser,
};

// TRANSFORMER REGISTRY - section transformer runs after cleanup
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

// EXPORT DEFAULT CONFIGURATION
export default {
  transform: (payload) => {
    const {
      document, url, html, params,
    } = payload;

    const main = document.body;

    // 1. beforeTransform transformers (initial cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block using registered parsers
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return; // Already replaced by earlier parser
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. afterTransform transformers (final cleanup + section breaks/metadata)
    executeTransformers('afterTransform', main, payload);

    // 5. Apply WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Generate sanitized path
    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, ''),
    );

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
