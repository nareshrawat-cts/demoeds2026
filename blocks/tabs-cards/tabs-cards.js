// eslint-disable-next-line import/no-unresolved
import { toClassName } from '../../scripts/aem.js';

/**
 * Restructures the flat authored content of a tab panel into article cards.
 * Authored content per card (repeated): image link, category link,
 * H3 title link, description link.
 * @param {Element} panel The tab panel element (second cell of each row)
 */
function buildCards(panel) {
  const grid = document.createElement('div');
  grid.className = 'grid-layout desktop-3-column grid-gap-md';

  const nodes = [...panel.children];
  let card = null;

  nodes.forEach((node) => {
    const img = node.querySelector('picture, img');
    if (img) {
      // start a new card on each image
      card = document.createElement('a');
      card.className = 'article-card';
      const link = node.querySelector('a');
      if (link) card.href = link.getAttribute('href');

      const imageWrap = document.createElement('div');
      imageWrap.className = 'article-card-image';
      const picture = node.querySelector('picture') || img;
      imageWrap.append(picture);
      card.append(imageWrap);

      const body = document.createElement('div');
      body.className = 'article-card-body';
      card.append(body);

      grid.append(card);
      return;
    }
    if (!card) return;
    const body = card.querySelector('.article-card-body');

    if (node.tagName === 'H3') {
      const a = node.querySelector('a');
      if (a) node.textContent = a.textContent;
      body.append(node);
    } else if (node.tagName === 'P') {
      const a = node.querySelector('a');
      const text = a ? a.textContent : node.textContent;
      // first P after image is the category tag, subsequent P is description
      if (!body.querySelector('.tag') && !body.querySelector('h3')) {
        const tag = document.createElement('div');
        tag.className = 'tag';
        tag.textContent = text;
        body.append(tag);
      } else {
        const p = document.createElement('p');
        p.textContent = text;
        body.append(p);
      }
    }
  });

  panel.textContent = '';
  panel.append(grid);
}

export default async function decorate(block) {
  // build tablist
  const tablist = document.createElement('div');
  tablist.className = 'tab-menu';
  tablist.setAttribute('role', 'tablist');

  // decorate tabs and tabpanels
  const tabs = [...block.children].map((child) => child.firstElementChild);
  tabs.forEach((tab, i) => {
    const id = toClassName(tab.textContent);

    // decorate tabpanel
    const tabpanel = block.children[i];
    tabpanel.className = `tab-pane${i === 0 ? ' is-active' : ''}`;
    tabpanel.id = `tabpanel-${id}`;
    tabpanel.setAttribute('aria-hidden', !!i);
    tabpanel.setAttribute('aria-labelledby', `tab-${id}`);
    tabpanel.setAttribute('role', 'tabpanel');

    // build cards from the content cell (second child of the row)
    const contentCell = tabpanel.querySelector(':scope > div:last-child');
    if (contentCell) buildCards(contentCell);

    // build tab button
    const button = document.createElement('button');
    button.className = `tab-menu-link${i === 0 ? ' is-active' : ''}`;
    button.id = `tab-${id}`;
    button.textContent = tab.textContent;
    button.setAttribute('aria-controls', `tabpanel-${id}`);
    button.setAttribute('aria-selected', !i);
    button.setAttribute('role', 'tab');
    button.setAttribute('type', 'button');
    button.addEventListener('click', () => {
      block.querySelectorAll('[role=tabpanel]').forEach((panel) => {
        panel.setAttribute('aria-hidden', true);
        panel.classList.remove('is-active');
      });
      tablist.querySelectorAll('button').forEach((btn) => {
        btn.setAttribute('aria-selected', false);
        btn.classList.remove('is-active');
      });
      tabpanel.setAttribute('aria-hidden', false);
      tabpanel.classList.add('is-active');
      button.setAttribute('aria-selected', true);
      button.classList.add('is-active');
    });
    tablist.append(button);
    tab.remove();
  });

  block.prepend(tablist);
}
