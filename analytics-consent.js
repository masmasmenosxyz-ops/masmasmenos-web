const measurementId = 'G-ZSB0ES5SCW';
const preferenceKey = 'masmasmenos.analytics-consent.v1';
const card = document.querySelector('#cookie-card');
const settings = document.querySelector('.cookie-settings');
const mobileMore = document.querySelector('.mobile-more-trigger');
const mobileMoreDialog = document.querySelector('#mobile-more-dialog');
const privacyButton = mobileMoreDialog.querySelector('.mobile-more-privacy');
const privacyNote = mobileMoreDialog.querySelector('.mobile-more-privacy-note');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const infoButton = card.querySelector('.cookie-info-button');
const infoPanel = card.querySelector('.cookie-info');
const choice = card.querySelector('.cookie-choice');
const closeLabel = card.querySelector('.cookie-close-label');
const infoLabel = card.querySelector('.cookie-info-label');

let analyticsLoaded = false;
let hideTimer = 0;

function readPreference() {
  try {
    const value = localStorage.getItem(preferenceKey);
    return value === 'granted' || value === 'denied' ? value : null;
  } catch {
    return null;
  }
}

function savePreference(value) {
  try {
    localStorage.setItem(preferenceKey, value);
  } catch {
    // The current visit still follows the user's choice if storage is unavailable.
  }
}

function startAnalytics() {
  if (analyticsLoaded) return;
  analyticsLoaded = true;
  window[`ga-disable-${measurementId}`] = false;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };

  // Basic consent mode: the Google script is requested only after consent.
  gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied'
  });
  gtag('consent', 'update', { analytics_storage: 'granted' });
  gtag('js', new Date());
  gtag('config', measurementId);

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.append(script);
}

function clearAnalyticsCookies() {
  const names = document.cookie.split(';')
    .map(part => part.trim().split('=')[0])
    .filter(name => /^_ga(?:_|$)/.test(name) || name === '_gid');
  const parts = location.hostname.split('.');
  const domains = ['', ...parts.map((_, index) => parts.slice(index).join('.'))];

  for (const name of names) {
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; Path=/${domain ? `; Domain=${domain}` : ''}`;
    }
  }
}

function showCard(restoreFocus = false) {
  clearTimeout(hideTimer);
  card.hidden = false;
  card.classList.remove('is-info');
  infoPanel.hidden = true;
  choice.hidden = false;
  infoButton.setAttribute('aria-expanded', 'false');
  infoLabel.hidden = false;
  closeLabel.hidden = true;
  settings.setAttribute('aria-expanded', 'true');
  // Establish the collapsed frame after removing [hidden] so the height transition runs.
  card.getBoundingClientRect();
  requestAnimationFrame(() => card.classList.add('is-open'));
  if (restoreFocus) card.querySelector('.cookie-yes').focus();
}

function hideCard() {
  card.classList.remove('is-open');
  settings.setAttribute('aria-expanded', 'false');
  hideTimer = setTimeout(() => { card.hidden = true; }, motion.matches ? 0 : 550);
}

function choose(value) {
  savePreference(value);
  hideCard();
  (matchMedia('(max-width: 600px)').matches ? mobileMore : settings).focus({ preventScroll: true });

  if (value === 'granted') {
    startAnalytics();
  } else if (analyticsLoaded) {
    window[`ga-disable-${measurementId}`] = true;
    gtag('consent', 'update', { analytics_storage: 'denied' });
    clearAnalyticsCookies();
    // A fresh page removes the already loaded tag from this visit.
    setTimeout(() => location.reload(), motion.matches ? 0 : 550);
  }
}

card.querySelector('.cookie-yes').addEventListener('click', () => choose('granted'));
card.querySelector('.cookie-no').addEventListener('click', () => choose('denied'));
card.querySelectorAll('.cookie-info-actions [data-consent]').forEach(button => {
  button.addEventListener('click', () => choose(button.dataset.consent));
});
settings.addEventListener('click', () => showCard(true));
const mobileMoreHome = mobileMore.parentElement;
const instagram = document.querySelector('.instagram-link');
const instagramHome = instagram.parentElement;
const instagramNextSibling = instagram.nextSibling;
let mobileMoreCloseTimer = 0;
function closeMobileMore(afterClose) {
  if (!mobileMoreDialog.open) { afterClose?.(); return; }
  mobileMoreDialog.classList.remove('is-open');
  mobileMore.setAttribute('aria-expanded', 'false');
  mobileMore.setAttribute('aria-label', 'More information');
  clearTimeout(mobileMoreCloseTimer);
  mobileMoreCloseTimer = setTimeout(() => {
    if (mobileMoreDialog.open) mobileMoreDialog.close();
    afterClose?.();
  }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 550);
}
mobileMore.addEventListener('click', () => {
  if (mobileMoreDialog.open) { closeMobileMore(); return; }
  privacyNote.hidden = true;
  privacyButton.setAttribute('aria-expanded', 'false');
  mobileMoreDialog.classList.remove('is-privacy');
  card.classList.remove('is-obscured');
  const cookieCardOpen = !card.hidden && card.classList.contains('is-open');
  if (card.classList.contains('is-info')) setInfo(false);
  mobileMoreDialog.classList.toggle('with-cookie-card', cookieCardOpen);
  mobileMoreDialog.showModal();
  mobileMoreDialog.append(instagram, mobileMore);
  mobileMore.setAttribute('aria-expanded', 'true');
  mobileMore.setAttribute('aria-label', 'Close information');
  requestAnimationFrame(() => mobileMoreDialog.classList.add('is-open'));
});
mobileMoreDialog.querySelector('.mobile-more-cookies').addEventListener('click', () => closeMobileMore(() => showCard(true)));
privacyButton.addEventListener('click', () => {
  const open = !mobileMoreDialog.classList.contains('is-privacy');
  mobileMoreDialog.classList.toggle('is-privacy', open);
  card.classList.toggle('is-obscured', open);
  privacyNote.hidden = !open;
  privacyButton.setAttribute('aria-expanded', String(open));
});
mobileMoreDialog.addEventListener('click', event => { if (event.target === mobileMoreDialog) closeMobileMore(); });
mobileMoreDialog.addEventListener('cancel', event => { event.preventDefault(); closeMobileMore(); });
mobileMoreDialog.addEventListener('close', () => {
  clearTimeout(mobileMoreCloseTimer);
  mobileMoreDialog.classList.remove('is-open');
  mobileMoreDialog.classList.remove('is-privacy');
  card.classList.remove('is-obscured');
  privacyNote.hidden = true;
  privacyButton.setAttribute('aria-expanded', 'false');
  mobileMore.setAttribute('aria-expanded', 'false');
  mobileMore.setAttribute('aria-label', 'More information');
  instagramHome.insertBefore(instagram, instagramNextSibling);
  mobileMoreHome.append(mobileMore);
  mobileMore.focus({ preventScroll: true });
});

const preference = readPreference();
if (preference === 'granted') startAnalytics();
if (preference === 'denied') clearAnalyticsCookies();

function revealConsentUI() {
  if (!settings.hidden) return;
  settings.hidden = false;
  if (!preference) showCard();
}

if (document.documentElement.classList.contains('opening')) {
  let introStarted = false;
  window.addEventListener('beta:intro-reveal-start', () => {
    introStarted = true;
    setTimeout(revealConsentUI, 850);
  }, { once: true });
  window.addEventListener('beta:opening-complete', () => {
    if (!introStarted) revealConsentUI();
  }, { once: true });
} else {
  revealConsentUI();
}

function setInfo(open) {
  card.classList.toggle('is-info', open);
  infoPanel.hidden = !open;
  choice.hidden = open;
  infoButton.setAttribute('aria-expanded', String(open));
  infoButton.setAttribute('aria-label', open ? 'Close cookie information' : 'Cookie information');
  infoLabel.hidden = open;
  closeLabel.hidden = !open;
  infoButton.focus();
}
infoButton.addEventListener('click', () => setInfo(infoPanel.hidden));
card.addEventListener('keydown', event => { if (event.key === 'Escape' && !infoPanel.hidden) { event.preventDefault(); setInfo(false); } });
