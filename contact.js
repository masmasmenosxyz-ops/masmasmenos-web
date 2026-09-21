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

let generation = 0;
let pending = false;
let entering = false;
let closing = false;

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
  if (!dialog.open) return;

  dialog.querySelectorAll('.contact-field').forEach(field => {
    const rect = field.querySelector('rect');
    const width = String(Math.max(0, field.clientWidth - 1));
    const height = String(Math.max(0, field.clientHeight - 1));

    if (rect.getAttribute('width') !== width) {
      rect.setAttribute('width', width);
    }

    if (rect.getAttribute('height') !== height) {
      rect.setAttribute('height', height);
    }
  });
}

function fitViewport() {
  if (!dialog.open) return;

  const nav = document
    .querySelector('.contact-nav')
    .getBoundingClientRect();

  const viewport = window.visualViewport;
  const visibleHeight = viewport?.height || innerHeight;

  const viewportBottom =
    (viewport?.offsetTop || 0) + visibleHeight;

  const obscuredBottom =
    Math.max(0, innerHeight - viewportBottom);

  const restingBottom =
    innerHeight - nav.top + 8;

  const bottom =
    Math.max(restingBottom, obscuredBottom + 8);

  const available = Math.max(
    100,
    visibleHeight -
      Math.max(0, bottom - obscuredBottom) -
      12
  );

  dialog.style.setProperty('--modal-bottom', `${bottom}px`);
  dialog.style.setProperty('--modal-available', `${available}px`);

  sizeOutlines();
}

const observer = new ResizeObserver(sizeOutlines);
dialog.querySelectorAll('.contact-field').forEach(field => {
  observer.observe(field);
});

window.addEventListener('resize', fitViewport);
window.visualViewport?.addEventListener('resize', fitViewport);
window.visualViewport?.addEventListener('scroll', fitViewport);

function cancelPresentation() {
  generation++;

  activeAnimations.forEach(animation => animation.cancel());
  activeAnimations.clear();

  window.betaMotion.restore(title);
}

async function animate(
  element,
  keyframes,
  duration,
  easing = 'cubic-bezier(.16,1,.3,1)'
) {
  if (motion.matches) return;

  const animation = element.animate(keyframes, {
    duration,
    easing,
    fill: 'both'
  });

  activeAnimations.add(animation);

  await animation.finished.catch(() => {});

  activeAnimations.delete(animation);
}

const wait = ms =>
  new Promise(resolve => setTimeout(resolve, ms));

async function openContact() {
  if (dialog.open && !closing) return;

  cancelPresentation();

  const version = generation;

  closing = false;
  entering = true;

  window.betaMotion.setContactOpen(true);

  dialog.classList.add('is-entering');
  title.style.removeProperty('visibility');

  syncControls();

  if (!dialog.open) {
    dialog.showModal();
  }

  dialog.focus({ preventScroll: true });
  fitViewport();

  if (!formEndpoint(config.formId)) {
    announce(
      'The contact form is temporarily unavailable. Please email us at',
      true
    );
  }

  /*
   * Entrada general del modal.
   */
  await animate(
    dialog,
    [
      {
        opacity: 0,
        transform: 'translateY(16px)'
      },
      {
        opacity: 1,
        transform: 'translateY(0)'
      }
    ],
    300
  );

  if (version !== generation) return;

  title.style.visibility = 'visible';

  const outlines = [
    ...dialog.querySelectorAll('.field-outline rect')
  ];

  const emailInput =
    dialog.querySelector('.contact-field input');

  const messageInput =
    dialog.querySelector('.contact-field textarea');

  const sendText =
    sendButton.querySelector('span');

  /*
   * Todo empieza a solaparse aquí.
   * No esperamos a que el título termine.
   */

  const titleReveal =
    window.betaMotion.reveal(title);

  // 1. Línea email
  const emailOutlineReveal = animate(
    outlines[0],
    [
      { strokeDashoffset: -1 },
      { strokeDashoffset: 0 }
    ],
    1100,
    'cubic-bezier(.16, 1, .2, 1)'
  );

  // 2. Texto email
  const emailTextReveal = (async () => {
    await wait(130);

    await animate(
      emailInput,
      [
        { opacity: 0 },
        { opacity: 1 }
      ],
      380,
      'ease-out'
    );
  })();

  // 3. Línea mensaje
  const messageOutlineReveal = (async () => {
    await wait(190);

    await animate(
      outlines[1],
      [
        { strokeDashoffset: -1 },
        { strokeDashoffset: 0 }
      ],
      1100,
      'cubic-bezier(.16, 1, .2, 1)'
    );
  })();

  // 4. Texto mensaje
  const messageTextReveal = (async () => {
    await wait(330);

    await animate(
      messageInput,
      [
        { opacity: 0 },
        { opacity: 1 }
      ],
      380,
      'ease-out'
    );
  })();

  // 5. Fill del botón Send
  const sendFillReveal = (async () => {
    await wait(410);

    await animate(
      sendButton,
      [
        { opacity: 0 },
        { opacity: 1 }
      ],
      500,
      'cubic-bezier(.16, 1, .3, 1)'
    );
  })();

  // 6. Texto Send
  const sendTextReveal = (async () => {
    await wait(650);

    await animate(
      sendText,
      [
        { opacity: 0 },
        { opacity: 1 }
      ],
      300,
      'ease-out'
    );
  })();

  await Promise.all([
    titleReveal,
    emailOutlineReveal,
    emailTextReveal,
    messageOutlineReveal,
    messageTextReveal,
    sendFillReveal,
    sendTextReveal
  ]);

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

  closing = true;
  entering = false;

  dialog.classList.remove('is-entering');
  title.style.visibility = 'visible';

  const outlines = [
    ...dialog.querySelectorAll('.field-outline rect')
  ];

  const emailInput =
    dialog.querySelector('.contact-field input');

  const messageInput =
    dialog.querySelector('.contact-field textarea');

  const sendText =
    sendButton.querySelector('span');

  /*
   * CIERRE
   * Inverso a la apertura, pero más rápido.
   */

  // 1. Texto Send
  const sendTextHide = animate(
    sendText,
    [
      { opacity: 1 },
      { opacity: 0 }
    ],
    70,
    'ease-in'
  );

  // 2. Fill Send
  const sendFillHide = (async () => {
    await wait(50);

    await animate(
      sendButton,
      [
        { opacity: 1 },
        { opacity: 0 }
      ],
      90,
      'ease-in'
    );
  })();

  // 3. Texto mensaje
  const messageTextHide = (async () => {
    await wait(100);

    await animate(
      messageInput,
      [
        { opacity: 1 },
        { opacity: 0 }
      ],
      80,
      'ease-in'
    );
  })();

  // 4. Línea mensaje
  const messageOutlineHide = (async () => {
    await wait(150);

    await animate(
      outlines[1],
      [
        { strokeDashoffset: 0 },
        { strokeDashoffset: -1 }
      ],
      500,
      'cubic-bezier(.4, 0, .8, .2)'
    );
  })();

  // 5. Texto email
  const emailTextHide = (async () => {
    await wait(220);

    await animate(
      emailInput,
      [
        { opacity: 1 },
        { opacity: 0 }
      ],
      80,
      'ease-in'
    );
  })();

  // 6. Línea email
  const emailOutlineHide = (async () => {
    await wait(270);

    await animate(
      outlines[0],
      [
        { strokeDashoffset: 0 },
        { strokeDashoffset: -1 }
      ],
      500,
      'cubic-bezier(.4, 0, .8, .2)'
    );
  })();

  await Promise.all([
    sendTextHide,
    sendFillHide,
    messageTextHide,
    messageOutlineHide,
    emailTextHide,
    emailOutlineHide
  ]);

  if (version !== generation) return;

  await animate(
    dialog,
    [
      {
        opacity: 1,
        transform: 'translateY(0)'
      },
      {
        opacity: 1,
        transform: 'translateY(2px)',
        offset: 0.55
      },
      {
        opacity: 0,
        transform: 'translateY(6px)'
      }
    ],
    280,
    'cubic-bezier(.22, .61, .6, 1)'
  );

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

dialog.addEventListener('cancel', event => {
  event.preventDefault();
  closeContact();
});

let outsidePress = false;

const isOutside = event => {
  const box = dialog.getBoundingClientRect();

  return (
    event.clientX < box.left ||
    event.clientX > box.right ||
    event.clientY < box.top ||
    event.clientY > box.bottom
  );
};

dialog.addEventListener('pointerdown', event => {
  outsidePress = isOutside(event);
});

dialog.addEventListener('click', event => {
  if (outsidePress && isOutside(event)) {
    closeContact();
  }

  outsidePress = false;
});

motion.addEventListener('change', () => {
  if (!dialog.open) return;

  if (closing) {
    cancelPresentation();

    dialog.close();

    closing = false;

    window.betaMotion.setContactOpen(false);

    trigger.focus({ preventScroll: true });
  } else {
    cancelPresentation();

    entering = false;

    dialog.classList.remove('is-entering');

    title.style.visibility = 'visible';
  }

  syncControls();
});

message.addEventListener('input', () => {
  message.setCustomValidity('');
});

form.addEventListener('submit', async event => {
  event.preventDefault();

  if (pending || entering) return;

  message.setCustomValidity(
    message.value.trim()
      ? ''
      : 'Please enter a message.'
  );

  if (!form.reportValidity()) return;

  if (!formEndpoint(config.formId)) {
    announce(
      'The contact form is temporarily unavailable. Please email us at',
      true
    );

    return;
  }

  pending = true;
  syncControls();

  announce('Sending your message…');

  try {
    await sendContact({
      formId: config.formId,
      email: email.value,
      message: message.value,
      honeypot: form.elements._gotcha.value
    });

    form.reset();

    announce('Message sent. Thank you!');
  } catch (error) {
    if (error.message === 'rate-limit') {
      announce(
        'Too many attempts. Please wait a moment and try again, or email',
        true
      );
    } else if (error.name === 'AbortError') {
      announce(
        'We couldn’t confirm delivery. Please wait before retrying, or email',
        true
      );
    } else {
      announce(
        'Your message could not be sent. Please try again, or email',
        true
      );
    }
  } finally {
    pending = false;
    syncControls();
  }
});
