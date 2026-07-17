import { getMetadata } from '../../scripts/aem.js';

// media query match that indicates desktop width
const isDesktop = window.matchMedia('(min-width: 900px)');

/**
 * Fetches the nav content fragment. Prefers the local /content path (aem up),
 * falls back to the metadata-configured nav path for DA/EDS production.
 */
async function fetchNav(navPath) {
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok && navPath) {
    resp = await fetch(`${navPath}.plain.html`);
  }
  if (!resp.ok) return null;
  const html = await resp.text();
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp;
}

function closeAllMenus(navMenu) {
  navMenu.querySelectorAll('.nav-item[aria-expanded="true"]').forEach((li) => {
    li.setAttribute('aria-expanded', 'false');
    const btn = li.querySelector('.nav-trigger');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  });
}

/**
 * Builds the brand/logo link from the first nav section.
 */
function buildBrand(section) {
  const brand = document.createElement('a');
  brand.className = 'nav-brand';
  const src = section.querySelector('a');
  brand.href = src ? src.getAttribute('href') : '/';
  const img = section.querySelector('img');
  if (img) {
    const icon = document.createElement('span');
    icon.className = 'nav-logo-icon';
    const logo = document.createElement('img');
    logo.src = img.getAttribute('src');
    logo.alt = img.getAttribute('alt') || '';
    icon.append(logo);
    brand.append(icon);
  }
  const label = document.createElement('span');
  label.className = 'nav-logo-text';
  label.textContent = (src ? src.textContent : 'Home').trim();
  brand.append(label);
  return brand;
}

/**
 * Builds a single megamenu group (trigger + dropdown panel) from a nav <li>.
 */
function buildNavGroup(li) {
  const item = document.createElement('li');
  item.className = 'nav-item';
  item.setAttribute('aria-expanded', 'false');

  const label = li.querySelector(':scope > p')?.textContent.trim() || '';
  const trigger = document.createElement('button');
  trigger.className = 'nav-trigger';
  trigger.type = 'button';
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-haspopup', 'true');
  trigger.textContent = label;
  item.append(trigger);

  const panel = document.createElement('div');
  panel.className = 'nav-megamenu';
  const grid = document.createElement('div');
  grid.className = 'nav-megamenu-grid';
  li.querySelectorAll(':scope > ul > li').forEach((entry) => {
    const link = entry.querySelector('a');
    if (!link) return;
    const a = document.createElement('a');
    a.className = 'nav-megamenu-link';
    a.href = link.getAttribute('href');
    const title = document.createElement('span');
    title.className = 'nav-megamenu-link-title';
    title.textContent = link.textContent.trim();
    a.append(title);
    const desc = entry.textContent.replace(link.textContent, '').trim();
    if (desc) {
      a.append(document.createTextNode(' '));
      const d = document.createElement('span');
      d.className = 'nav-megamenu-link-desc';
      d.textContent = desc;
      a.append(d);
    }
    grid.append(a);
  });
  grid.classList.add(`nav-megamenu-grid--${grid.children.length}`);
  panel.append(grid);
  item.append(panel);
  return item;
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const frag = await fetchNav(navPath);
  block.textContent = '';
  if (!frag) return;

  const sections = [...frag.children];
  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main navigation');

  // brand
  if (sections[0]) nav.append(buildBrand(sections[0]));

  // nav menu (megamenu groups)
  const navMenu = document.createElement('ul');
  navMenu.className = 'nav-menu';
  const groups = sections[1] ? sections[1].querySelectorAll(':scope > ul > li') : [];
  groups.forEach((li) => navMenu.append(buildNavGroup(li)));
  nav.append(navMenu);

  // tools / CTA (Subscribe)
  const tools = document.createElement('div');
  tools.className = 'nav-tools';
  const ctaLink = sections[2]?.querySelector('a');
  if (ctaLink) {
    const cta = document.createElement('a');
    cta.className = 'button nav-cta';
    cta.href = ctaLink.getAttribute('href');
    cta.textContent = ctaLink.textContent.trim();
    tools.append(cta);
  }
  nav.append(tools);

  // hamburger (mobile)
  const hamburger = document.createElement('button');
  hamburger.className = 'nav-hamburger';
  hamburger.type = 'button';
  hamburger.setAttribute('aria-label', 'Open navigation');
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.innerHTML = '<span class="nav-hamburger-icon"></span>';
  nav.prepend(hamburger);

  // desktop: hover opens megamenu; click toggles (touch/keyboard)
  navMenu.querySelectorAll('.nav-item').forEach((item) => {
    const trigger = item.querySelector('.nav-trigger');
    item.addEventListener('mouseenter', () => {
      if (!isDesktop.matches) return;
      closeAllMenus(navMenu);
      item.setAttribute('aria-expanded', 'true');
      trigger.setAttribute('aria-expanded', 'true');
    });
    item.addEventListener('mouseleave', () => {
      if (!isDesktop.matches) return;
      item.setAttribute('aria-expanded', 'false');
      trigger.setAttribute('aria-expanded', 'false');
    });
    trigger.addEventListener('click', () => {
      const open = item.getAttribute('aria-expanded') === 'true';
      if (!open) closeAllMenus(navMenu);
      item.setAttribute('aria-expanded', String(!open));
      trigger.setAttribute('aria-expanded', String(!open));
    });
  });

  // mobile: hamburger toggles the whole menu
  hamburger.addEventListener('click', () => {
    const open = nav.classList.toggle('nav-open');
    hamburger.setAttribute('aria-expanded', String(open));
    hamburger.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    if (!open) closeAllMenus(navMenu);
  });

  // close on escape
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') {
      closeAllMenus(navMenu);
      if (nav.classList.contains('nav-open')) {
        nav.classList.remove('nav-open');
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.setAttribute('aria-label', 'Open navigation');
      }
    }
  });

  // reset state when crossing the desktop/mobile breakpoint
  isDesktop.addEventListener('change', () => {
    closeAllMenus(navMenu);
    nav.classList.remove('nav-open');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-label', 'Open navigation');
  });

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
