/**
 * hero-cta — centered call-to-action banner.
 * Groups the CTA buttons into a single centered row and marks the
 * first button as primary and any subsequent buttons as secondary.
 * @param {Element} block
 */
export default function decorate(block) {
  const content = block.querySelector(':scope > div > div') || block;

  // Collect button-containers (EDS wraps standalone <p><a> links)
  const buttonContainers = [...content.querySelectorAll(':scope > .button-container')];
  const buttons = buttonContainers
    .map((c) => c.querySelector('a.button'))
    .filter(Boolean);

  if (buttons.length) {
    const group = document.createElement('div');
    group.className = 'hero-cta-buttons';
    buttons.forEach((btn, i) => {
      btn.classList.remove('primary', 'secondary');
      btn.classList.add(i === 0 ? 'primary' : 'secondary');
      group.append(btn);
    });
    // insert the group where the first button-container was, then remove the empty wrappers
    content.insertBefore(group, buttonContainers[0]);
    buttonContainers.forEach((c) => c.remove());
  }
}
