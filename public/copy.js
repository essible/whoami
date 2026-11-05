// Adds a Copy button to every code block in a writeup, and fades the side of a block while
// code is hidden past it (a long line that scrolls sideways).
// This is the only script on the site, and it only loads on writeup pages. Without it the
// code is still there to select and scroll by hand. No dependencies, no innerHTML (the CSP enforces
// Trusted Types, so HTML string sinks would throw anyway).

const status = document.createElement('span');
status.className = 'sr-only';
status.setAttribute('role', 'status');
document.body.append(status);

function selectText(node) {
  const range = document.createRange();
  range.selectNodeContents(node);
  const selection = getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

async function copy(text, node) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers, or a frame without clipboard access: fall back to a selection.
    selectText(node);
    try {
      return document.execCommand('copy');
    } catch {
      return false;
    }
  }
}

for (const pre of document.querySelectorAll('.prose pre')) {
  const code = pre.querySelector('code') ?? pre;
  const block = document.createElement('div');
  block.className = 'code-block';
  pre.replaceWith(block);
  block.append(pre);

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'copy-btn';
  button.setAttribute('aria-label', 'Copy code');
  button.textContent = 'Copy';
  block.append(button);

  // The fades themselves are drawn in global.css; this only says which sides have more code.
  const showEdges = () => {
    const hidden = pre.scrollWidth - pre.clientWidth;
    block.classList.toggle('is-more-left', pre.scrollLeft > 1);
    block.classList.toggle('is-more-right', pre.scrollLeft < hidden - 1);
  };
  pre.addEventListener('scroll', showEdges, { passive: true });
  // Runs once right away, then whenever the box or the code changes size (window resize, fonts).
  const resizes = new ResizeObserver(showEdges);
  resizes.observe(pre);
  resizes.observe(code);

  let timer;
  button.addEventListener('click', async () => {
    const ok = await copy(code.textContent.replace(/\n$/, ''), code);
    button.textContent = ok ? 'Copied' : 'Selected';
    button.classList.toggle('is-copied', ok);
    status.textContent = ok ? 'Copied to clipboard' : 'Code selected. Copy it with your keyboard or menu.';
    clearTimeout(timer);
    timer = setTimeout(() => {
      button.textContent = 'Copy';
      button.classList.remove('is-copied');
      status.textContent = '';
    }, 2000);
  });
}
