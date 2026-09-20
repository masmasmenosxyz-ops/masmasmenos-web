export function formEndpoint(formId) {
  return typeof formId === 'string' && /^[a-zA-Z0-9]{6,64}$/.test(formId)
    ? `https://formspree.io/f/${formId}` : null;
}

export async function sendContact({ formId, email, message, honeypot = '' }, fetcher = fetch) {
  const endpoint = formEndpoint(formId);
  if (!endpoint) throw new Error('unconfigured');
  if (!email.trim() || !message.trim() || message.length > 5000) throw new Error('invalid');
  if (honeypot) throw new Error('spam');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetcher(endpoint, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), message: message.trim(), _gotcha: honeypot }),
      signal: controller.signal
    });
    if (!response.ok) throw new Error(response.status === 429 ? 'rate-limit' : 'rejected');
    const result = await response.json();
    if (result.ok !== true && result.success !== true) throw new Error('rejected');
    return result;
  } finally { clearTimeout(timeout); }
}
