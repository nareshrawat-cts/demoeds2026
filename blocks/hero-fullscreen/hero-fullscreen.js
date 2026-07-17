/**
 * Full-screen hero with background image, dark scrim overlay and
 * centered content (eyebrow pill, heading, lead paragraph, CTAs).
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const rows = [...block.children];

  // Identify the picture (background) and the content column.
  const picture = block.querySelector('picture');
  const contentRow = rows.find((row) => row.querySelector('h1, h2, h3, p:not(:empty)'));

  // Flatten: move the picture to be a direct child of the block, and lift the
  // authored content cell up so styling targets `.hero-fullscreen > div`.
  if (picture && picture.parentElement !== block) {
    block.prepend(picture);
  }

  let content = contentRow;
  if (contentRow) {
    // The authored structure is row > cell; unwrap so the block has a single
    // content <div> as its (second) child.
    const cell = contentRow.querySelector(':scope > div');
    if (cell) {
      content = cell;
      contentRow.replaceWith(cell);
    }
  }

  // Remove any now-empty picture wrapper rows.
  rows.forEach((row) => {
    if (row.parentElement === block && !row.textContent.trim() && !row.querySelector('picture, img')) {
      row.remove();
    }
  });

  if (content) {
    content.classList.add('hero-fullscreen-content');

    // First paragraph becomes the eyebrow pill.
    const firstP = content.querySelector(':scope > p');
    if (firstP && !firstP.querySelector('a') && firstP.textContent.trim()) {
      firstP.classList.add('tag-pill');
    }

    // Style CTA links as buttons: first = primary (accent), rest = ghost.
    const ctaLinks = [...content.querySelectorAll('p > a')];
    if (ctaLinks.length) {
      const group = document.createElement('div');
      group.className = 'hero-fullscreen-buttons';
      ctaLinks.forEach((a, i) => {
        a.classList.add('button');
        a.classList.add(i === 0 ? 'primary' : 'ghost');
        const p = a.closest('p');
        group.append(a);
        if (p && !p.textContent.trim()) p.remove();
      });
      content.append(group);
    }
  }

  // Dark gradient scrim over the image for text legibility.
  if (picture && !block.querySelector('.hero-fullscreen-overlay')) {
    const overlay = document.createElement('div');
    overlay.className = 'hero-fullscreen-overlay';
    picture.after(overlay);
  }

  if (!picture) block.classList.add('no-image');
}
