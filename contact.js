import { formEndpoint, sendContact } from './contact-transport.js';

const dialog = document.querySelector('#contact-dialog');
const trigger = document.querySelector('.contact-trigger');
const closeButton = dialog.querySelector('.contact-close');
const title = dialog.querySelector('.contact-title');
const form = dialog.querySelector('form');
const fields = form.querySelector('fieldset');
const sendButton = form.querySelector('.contact-send');
const status = dialog.querySelector('.contact-status');
const email = form.elements.email;
const message = form.elements.message;
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const activeAnimations = new Set();
const config = window.BETA_CONTACT_CONFIG || {};
let generation = 0, pending = false, entering = false, closing = false;

function announce(text, fallback = false) {
  status.replaceChildren(document.createTextNode(text));
  if (fallback) {
    const link = document.createElement('a');
    link.href = 'mailto:masmasmenos.xyz@gmail.com';
    link.textContent = 'masmasmenos.xyz@gmail.com';
    status.append(' ', link);
  }
  status.hidden = false;
}
function syncControls() {
  fields.disabled = entering || pending;
  sendButton.querySelector('span').textContent = pending ? 'Sending…' : 'Send';
  form.setAttribute('aria-busy', String(pending));
}
function sizeOutlines() {
  dialog.querySelectorAll('.contact-field').forEach(field => {
    const rect = field.querySelector('rect');
    rect.setAttribute('width', Math.max(0, field.clientWidth - 1));
    rect.setAttribute('height', Math.max(0, field.clientHeight - 1));
  });
}
function fitViewport() {
  if (!dialog.open) return;
  const nav = document.querySelector('.contact-nav').getBoundingClientRect();
  const viewport = window.visualViewport;
  const visibleHeight = viewport?.height || innerHeight;
  const viewportBottom = (viewport?.offsetTop || 0) + visibleHeight;
  const obscuredBottom = Math.max(0, innerHeight - viewportBottom);
  const restingBottom = innerHeight - nav.top + 8;
  const bottom = Math.max(restingBottom, obscuredBottom + 8);
  const available = Math.max(100, visibleHeight - Math.max(0, bottom - obscuredBottom) - 12);
  dialog.style.setProperty('--modal-bottom', `${bottom}px`);
  dialog.style.setProperty('--modal-available', `${available}px`);
  sizeOutlines();
}
const observer = new ResizeObserver(sizeOutlines);
observer.observe(dialog);
window.addEventListener('resize', fitViewport);
window.visualViewport?.addEventListener('resize', fitViewport);
window.visualViewport?.addEventListener('scroll', fitViewport);

function cancelPresentation() {
  generation++;
  activeAnimations.forEach(animation => animation.cancel());
  activeAnimations.clear();
  window.betaMotion.restore(title);
}
async function animate(element, keyframes, duration) {
  if (motion.matches) return;
  const animation = element.animate(keyframes, { duration, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' });
  activeAnimations.add(animation);
  await animation.finished.catch(() => {});
}
async function openContact() {
  if (dialog.open && !closing) return;
  cancelPresentation();
  const version = generation;
  closing = false; entering = true;
  window.betaMotion.setContactOpen(true);
  dialog.classList.add('is-entering');
  title.style.removeProperty('visibility');
  syncControls();
  if (!dialog.open) dialog.showModal();
  dialog.focus({ preventScroll: true });
  fitViewport();
  if (!formEndpoint(config.formId)) {
    announce('The contact form is temporarily unavailable. Please email us at', true);
  }
  await animate(dialog, [{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'translateY(0)' }], 360);
  if (version !== generation) return;
  title.style.visibility = 'visible';
  await window.betaMotion.reveal(title);
  if (version !== generation) return;
  await Promise.all([...dialog.querySelectorAll('.field-outline rect')].map(rect => animate(rect, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], 400)));
  if (version !== generation) return;
  await Promise.all([...dialog.querySelectorAll('.contact-field input, .contact-field textarea, .contact-send')].map(element => animate(element, [{ opacity: 0 }, { opacity: 1 }], 240)));
  if (version !== generation) return;
  dialog.classList.remove('is-entering');
  entering = false;
  activeAnimations.forEach(animation => animation.cancel());
  activeAnimations.clear();
  syncControls();
}
async function closeContact() {
  if (!dialog.open || closing) return;
  cancelPresentation();
  const version = generation;
  closing = true; entering = false;
  dialog.classList.remove('is-entering');
  title.style.visibility = 'visible';
  await animate(dialog, [{ opacity: 1 }, { opacity: 0 }], 180);
  if (version !== generation) return;
  dialog.close();
  cancelPresentation();
  closing = false;
  syncControls();
  window.betaMotion.setContactOpen(false);
  trigger.focus({ preventScroll: true });
}
trigger.addEventListener('click', openContact);
closeButton.addEventListener('click', closeContact);
dialog.addEventListener('cancel', event => { event.preventDefault(); closeContact(); });
let outsidePress = false;
const isOutside = event => {
  const box = dialog.getBoundingClientRect();
  return event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom;
};
dialog.addEventListener('pointerdown', event => { outsidePress = isOutside(event); });
dialog.addEventListener('click', event => { if (outsidePress && isOutside(event)) closeContact(); outsidePress = false; });
motion.addEventListener('change', () => {
  if (!dialog.open) return;
  if (closing) {
    cancelPresentation(); dialog.close(); closing = false;
    window.betaMotion.setContactOpen(false); trigger.focus({ preventScroll: true });
  } else {
    cancelPresentation(); entering = false;
    dialog.classList.remove('is-entering'); title.style.visibility = 'visible';
  }
  syncControls();
});
message.addEventListener('input', () => message.setCustomValidity(''));
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (pending || entering) return;
  message.setCustomValidity(message.value.trim() ? '' : 'Please enter a message.');
  if (!form.reportValidity()) return;
  if (!formEndpoint(config.formId)) {
    announce('The contact form is temporarily unavailable. Please email us at', true);
    return;
  }
  pending = true; syncControls();
  announce('Sending your message…');
  try {
    await sendContact({ formId: config.formId, email: email.value, message: message.value, honeypot: form.elements._gotcha.value });
    form.reset();
    announce('Message sent. Thank you!');
  } catch (error) {
    if (error.message === 'rate-limit') announce('Too many attempts. Please wait a moment and try again, or email', true);
    else if (error.name === 'AbortError') announce('We couldn’t confirm delivery. Please wait before retrying, or email', true);
    else announce('Your message could not be sent. Please try again, or email', true);
  } finally { pending = false; syncControls(); }
});
