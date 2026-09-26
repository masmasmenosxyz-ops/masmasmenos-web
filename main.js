const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const root = document.documentElement;
const logo = document.querySelector('.hero-logo');
const clamp = (n, low, high) => Math.max(low, Math.min(high, n));
const symbols = ['+', '−', '_', '.'];
const HOVER_RADIUS = 40;
const current = { rx: 0, ry: 0 };
const target = { ...current };
const texts = [];
let pointer = null, frame = 0, lastTime = 0;
let logoInteractive = !root.classList.contains('opening');
let finishOpening = () => {};
let contactOpen = false;

// Preserve text flow while assigning a continuous index, including spaces and BRs.
for (const element of document.querySelectorAll('[data-scramble], [data-reveal]')) {
  const accessibleCopy = element.cloneNode(true);
  accessibleCopy.querySelectorAll('br').forEach(br => br.replaceWith(' '));
  element.setAttribute('aria-label', accessibleCopy.textContent);
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  const nodes = [];
  while (walker.nextNode()) {
    if (walker.currentNode.nodeType === Node.TEXT_NODE || walker.currentNode.nodeName === 'BR') nodes.push(walker.currentNode);
  }
  let index = 0;
  const letters = [];
  for (const node of nodes) {
    if (node.nodeName === 'BR') { index++; continue; }
    const fragment = document.createDocumentFragment();
    for (const part of node.textContent.split(/(\s+)/)) {
      if (!part.trim()) { fragment.append(document.createTextNode(part)); index += Array.from(part).length; continue; }
      const word = document.createElement('span');
      word.className = 'word'; word.setAttribute('aria-hidden', 'true');
      for (const character of part) {
        const span = document.createElement('span');
        span.className = 'letter'; span.textContent = character;
        span.dataset.index = index;
        letters.push({ span, index: index++, x: 0, y: 0, inside: false, restoreAt: 0, next: 0 });
        word.append(span);
      }
      fragment.append(word);
    }
    node.replaceWith(fragment);
  }
  const lastIndex = letters.at(-1)?.index || 0;
  const revealDuration = lastIndex * 13;
  // Inverse ease-out: tightly spaced first letters, progressively slower ending.
  for (const letter of letters) {
    letter.delay = lastIndex ? revealDuration * (1 - Math.sqrt(1 - letter.index / lastIndex)) : 0;
  }
  texts.push({ element, letters, start: null, resolve: null, duration: revealDuration + 460 });
}

function measureLetters() {
  for (const text of texts) for (const letter of text.letters) {
    const box = letter.span.getBoundingClientRect();
    letter.x = box.left + box.width / 2; letter.y = box.top + box.height / 2;
  }
}
function restoreText(text) {
  text.start = null;
  for (const letter of text.letters) {
    letter.span.classList.remove('is-symbol', 'is-hidden');
    letter.inside = false; letter.restoreAt = 0; letter.next = 0;
  }
  text.resolve?.(); text.resolve = null;
}
function requestTick() {
  if (!frame) { lastTime = performance.now(); frame = requestAnimationFrame(tick); }
}
// One frame loop handles pointer proximity, independent symbols and logo easing.
function tick(time) {
  const dt = Math.min(time - lastTime || 16, 40); lastTime = time;
  let moving = false;
  for (const key of Object.keys(current)) {
    current[key] += (target[key] - current[key]) * (1 - Math.exp(-dt / 115));
    if (Math.abs(target[key] - current[key]) < .005) current[key] = target[key];
    else moving = true;
  }
  logo.style.setProperty('--tilt-x', `${current.rx}deg`);
  logo.style.setProperty('--tilt-y', `${current.ry}deg`);
  const hoverEnabled = !contactOpen && !root.classList.contains('opening') && !reducedMotion.matches && finePointer.matches;
  for (const text of texts) {
    if (text.start !== null && time - text.start >= text.duration) restoreText(text);
    for (const letter of text.letters) {
      let symbol = false, hidden = false;
      if (text.start !== null) {
        const local = time - text.start - letter.delay;
        hidden = local < 0; symbol = local >= 0 && local < 460; moving = true;
      } else {
        const inside = Boolean(text.element.hasAttribute('data-scramble') && hoverEnabled && pointer && Math.hypot(pointer.x - letter.x, pointer.y - letter.y) <= HOVER_RADIUS);
        if (inside) { letter.restoreAt = 0; if (!letter.inside) letter.next = 0; }
        else if (letter.inside) letter.restoreAt = time + 180;
        letter.inside = inside;
        symbol = inside || time < letter.restoreAt;
        if (symbol) moving = true;
      }
      letter.span.classList.toggle('is-hidden', hidden);
      letter.span.classList.toggle('is-symbol', symbol);
      if (symbol && time >= letter.next) {
        letter.span.dataset.symbol = symbols[Math.floor(Math.random() * symbols.length)];
        letter.next = time + 110 + Math.random() * 340;
      }
    }
  }
  frame = moving ? requestAnimationFrame(tick) : 0;
}
function clearPointer() {
  pointer = null; target.rx = 0; target.ry = 0; requestTick();
}
function updateLogoTarget() {
  const active = !contactOpen && logoInteractive && pointer && finePointer.matches && !reducedMotion.matches;
  target.rx = active ? -clamp((pointer.y / innerHeight - .5) * 2, -1, 1) * 3 : 0;
  target.ry = active ? clamp((pointer.x / innerWidth - .5) * 2, -1, 1) * 4 : 0;
  requestTick();
}
document.addEventListener('pointermove', event => {
  if (reducedMotion.matches || !finePointer.matches || event.pointerType === 'touch') return;
  pointer = { x: event.clientX, y: event.clientY };
  updateLogoTarget();
});
document.documentElement.addEventListener('pointerleave', clearPointer);
window.addEventListener('blur', clearPointer);
finePointer.addEventListener('change', clearPointer);
window.addEventListener('resize', () => { clearPointer(); measureLetters(); });
document.fonts.ready.then(measureLetters);
measureLetters();
reducedMotion.addEventListener('change', () => {
  pointer = null;
  Object.assign(current, { rx: 0, ry: 0 }); Object.assign(target, current);
  texts.forEach(restoreText); requestTick();
});

async function openPage() {
  if (!root.classList.contains('opening')) return;
  const surface = document.querySelector('.opening-surface');
  const anchor = document.querySelector('.logo-anchor');
  const wordmark = document.querySelector('.opening-wordmark');
  const nav = document.querySelector('.contact-nav');
  let openingWidth = innerWidth;
  // Mobile browser chrome changes viewport height during load; keep the entrance alive.
  const onOpeningResize = () => {
    if (Math.abs(innerWidth - openingWidth) > 80) finish();
  };
  const active = new Set();
  const timers = new Map();
  const wait = ms => new Promise(resolve => {
    const id = setTimeout(() => { timers.delete(id); resolve(); }, ms);
    timers.set(id, resolve);
  });
  let stopped = false;
  const finish = () => {
    if (stopped) return;
    stopped = true;
    root.classList.remove('opening');
    logoInteractive = true;
    timers.forEach((resolve, id) => { clearTimeout(id); resolve(); });
    timers.clear();
    updateLogoTarget();
    active.forEach(animation => animation.cancel());
    texts.forEach(text => { restoreText(text); text.element.style.removeProperty('visibility'); });
    anchor.style.removeProperty('visibility');
    window.removeEventListener('resize', onOpeningResize);
    reducedMotion.removeEventListener('change', finish);
    measureLetters();
  };
  finishOpening = finish;
  const animate = async (element, keyframes, duration, delay = 0) => {
    if (stopped) return;
    const animation = element.animate(keyframes, { duration, delay, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' });
    active.add(animation);
    await animation.finished.catch(() => {});
  };
  const reveal = async text => {
    if (stopped) return;
    text.letters.forEach(letter => { letter.span.classList.add('is-hidden'); letter.next = 0; });
    text.element.style.visibility = 'visible';
    text.start = performance.now();
    await new Promise(resolve => { text.resolve = resolve; requestTick(); });
  };
  window.addEventListener('resize', onOpeningResize);
  reducedMotion.addEventListener('change', finish);
  try {
    // Hold the black storyboard frame while first-frame assets and fonts load.
    await Promise.all([document.fonts.ready, ...[logo, document.querySelector('.opening-wordmark img')].map(image => image.complete ? Promise.resolve() : new Promise(resolve => {
      image.addEventListener('load', resolve, { once: true }); image.addEventListener('error', resolve, { once: true });
    }))]);
    if (stopped) return;
    openingWidth = innerWidth;
    await Promise.all([
      animate(wordmark, [{ transform: 'translateY(-110%)' }, { transform: 'translateY(0)' }], 620),
      animate(nav, [{ transform: 'translateY(calc(100% + 24px))' }, { transform: 'translateY(0)' }], 620)
    ]);
    if (stopped) return;
    const box = anchor.getBoundingClientRect();
    const offset = innerHeight / 2 - (box.top + box.height / 2);
    // Hermite curves share a nonzero vertical velocity at the horizontal milestone.
    // X settles at 450ms while Y carries its momentum through to the full viewport.
    const hermite = (u, from, to, startSlope, endSlope) =>
      (2*u**3 - 3*u**2 + 1)*from + (u**3 - 2*u**2 + u)*startSlope +
      (-2*u**3 + 3*u**2)*to + (u**3 - u**2)*endSlope;
    const surfaceFrames = Array.from({ length: 96 }, (_, index) => {
      const time = index * 10;
      const x = 1 - (1 - Math.min(time / 450, 1)) ** 3;
      const y = time <= 450
        ? hermite(time / 450, 0, .46, .9, .9)
        : hermite((time - 450) / 500, .46, 1, 1, 0);
      return { transform: `scale(${x}, ${y})`, offset: time / 950 };
    });
    const surfaceAnimation = surface.animate(surfaceFrames, { duration: 950, easing: 'linear', fill: 'both' });
    active.add(surfaceAnimation);
    // Iso starts at 770ms. Text starts 450ms later; pointer tilt unlocks at 900ms.
    await Promise.all([
      surfaceAnimation.finished.catch(() => {}),
      (async () => {
        await animate(anchor, [
          { visibility: 'visible', transform: `translateY(${offset}px) scale(0)` },
          { visibility: 'visible', transform: 'translateY(0) scale(1)' }
        ], 900, 770);
        if (stopped) return;
        logoInteractive = true;
        updateLogoTarget();
      })(),
      (async () => {
        await wait(1220);
        if (stopped) return;
        await reveal(texts[0]);
        await reveal(texts[1]);
      })()
    ]);
  } finally { finish(); }
}
openPage();

// Shared presentation-only text animation; form values are never passed here.
window.betaMotion = {
  setContactOpen(value) {
    if (value) finishOpening();
    contactOpen = value;
    clearPointer();
  },
  reveal(element) {
    const text = texts.find(item => item.element === element);
    if (!text) return Promise.resolve();
    restoreText(text);
    if (reducedMotion.matches) return Promise.resolve();
    text.letters.forEach(letter => letter.span.classList.add('is-hidden'));
    text.start = performance.now();
    return new Promise(resolve => { text.resolve = resolve; requestTick(); });
  },
  restore(element) {
    const text = texts.find(item => item.element === element);
    if (text) restoreText(text);
  }
};
