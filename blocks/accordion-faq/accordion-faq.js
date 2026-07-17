/*
 * Accordion FAQ Block
 * Expandable question/answer rows. Each row has a question cell and an
 * answer cell. The question becomes a toggle button with a rotating "+"
 * icon; the answer animates open via max-height.
 */

export default function decorate(block) {
  [...block.children].forEach((row) => {
    const [labelCell, bodyCell] = row.children;

    // build the toggle button from the question cell
    const button = document.createElement('button');
    button.className = 'accordion-faq-question';
    button.type = 'button';
    button.setAttribute('aria-expanded', 'false');

    const label = document.createElement('span');
    label.className = 'accordion-faq-label';
    label.append(...labelCell.childNodes);

    const icon = document.createElement('span');
    icon.className = 'accordion-faq-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = '+';

    button.append(label, icon);

    // answer body
    bodyCell.className = 'accordion-faq-answer';

    // reset the row as the accordion item
    row.className = 'accordion-faq-item';
    labelCell.remove();
    row.prepend(button);

    button.addEventListener('click', () => {
      const open = row.classList.toggle('is-open');
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });
}
