import { getMetadata } from '../../scripts/aem.js';

/**
 * Fetches the footer content fragment. Prefers the local /content path (aem up),
 * falls back to the metadata-configured footer path for DA/EDS production.
 */
async function fetchFooter(footerPath) {
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok && footerPath) {
    resp = await fetch(`${footerPath}.plain.html`);
  }
  if (!resp.ok) return null;
  const html = await resp.text();
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp;
}

/**
 * Builds the brand column (logo + tagline) from the first section.
 */
function buildBrand(section) {
  const col = document.createElement('div');
  col.className = 'footer-brand';
  const img = section.querySelector('img');
  const paras = section.querySelectorAll('p');
  if (img) {
    const logo = document.createElement('a');
    logo.className = 'footer-logo';
    logo.href = '/content/index';
    const icon = document.createElement('span');
    icon.className = 'footer-logo-icon';
    const logoImg = document.createElement('img');
    logoImg.src = img.getAttribute('src');
    logoImg.alt = img.getAttribute('alt') || '';
    icon.append(logoImg);
    logo.append(icon);
    const label = document.createElement('span');
    label.className = 'footer-logo-text';
    label.textContent = (paras[0]?.textContent || 'WKND Adventures').trim();
    logo.append(label);
    col.append(logo);
  }
  if (paras[1]) {
    const tagline = document.createElement('p');
    tagline.className = 'footer-tagline';
    tagline.textContent = paras[1].textContent.trim();
    col.append(tagline);
  }
  return col;
}

/**
 * Builds a link column (heading + list) from a section.
 */
function buildLinkColumn(section) {
  const col = document.createElement('div');
  col.className = 'footer-column';
  const heading = section.querySelector('h4, h3, h2');
  if (heading) {
    const h = document.createElement('h4');
    h.textContent = heading.textContent.trim();
    col.append(h);
  }
  const list = section.querySelector('ul');
  if (list) col.append(list.cloneNode(true));
  return col;
}

/**
 * Builds the legal bar (copyright + secondary text) from the last section.
 */
function buildLegalBar(section) {
  const bar = document.createElement('div');
  bar.className = 'footer-bottom';
  section.querySelectorAll('p').forEach((p) => {
    const el = document.createElement('p');
    el.textContent = p.textContent.trim();
    bar.append(el);
  });
  return bar;
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const frag = await fetchFooter(footerPath);
  block.textContent = '';
  if (!frag) return;

  const sections = [...frag.children];
  const footer = document.createElement('div');
  footer.className = 'footer-inner';

  // top: brand + link columns (all sections except the last legal bar)
  const top = document.createElement('div');
  top.className = 'footer-top';
  const linkSections = sections.slice(0, -1);
  linkSections.forEach((section, i) => {
    if (i === 0) top.append(buildBrand(section));
    else top.append(buildLinkColumn(section));
  });
  footer.append(top);

  // bottom: legal bar (last section)
  const last = sections[sections.length - 1];
  if (last) footer.append(buildLegalBar(last));

  block.append(footer);
}
