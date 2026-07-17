/*
 * Ticker Block
 * Renders a set of short keyword labels as a continuously scrolling
 * horizontal marquee. Authored as one row per keyword, a single row with
 * each keyword on its own line, or a single paragraph with keywords
 * separated by middots. Content is duplicated inside one track so the
 * translateX(-50%) animation loops seamlessly.
 */

export default function decorate(block) {
  // collect keyword labels from authored content
  const labels = [];
  [...block.children].forEach((row) => {
    const cell = row.firstElementChild || row;
    const items = cell.querySelectorAll('p, li');
    if (items.length) {
      items.forEach((el) => {
        const text = el.textContent.trim();
        if (text) labels.push(text);
      });
    } else {
      const text = cell.textContent.trim();
      if (text) labels.push(text);
    }
  });

  // support a single paragraph that lists keywords separated by middots or commas
  const expanded = [];
  labels.forEach((label) => {
    if (/[·,]/.test(label)) {
      label.split(/[·,]/).forEach((part) => {
        const t = part.trim();
        if (t) expanded.push(t);
      });
    } else {
      expanded.push(label);
    }
  });
  const keywords = expanded.length ? expanded : labels;

  // build a single track containing the sequence twice; translateX(-50%)
  // then loops seamlessly because the second half mirrors the first.
  const track = document.createElement('div');
  track.className = 'ticker-track';

  const appendItem = (label) => {
    const item = document.createElement('span');
    item.className = 'ticker-item';
    item.textContent = label;
    track.append(item);
    // separator after every item so the loop point is also separated
    const sep = document.createElement('span');
    sep.className = 'ticker-sep';
    sep.setAttribute('aria-hidden', 'true');
    sep.textContent = '·';
    track.append(sep);
  };

  // two passes = 200% content width so translateX(-50%) loops seamlessly
  for (let pass = 0; pass < 2; pass += 1) {
    keywords.forEach((label) => appendItem(label));
  }

  block.textContent = '';
  block.append(track);
}
