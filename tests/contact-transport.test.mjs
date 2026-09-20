import test from 'node:test';
import assert from 'node:assert/strict';
import { formEndpoint, sendContact } from '../contact-transport.js';
const request = { formId: 'testform', email: ' visitor@example.com ', message: ' Hello studio ' };

test('requires a public form ID, never an arbitrary destination', () => {
  assert.equal(formEndpoint(''), null);
  assert.equal(formEndpoint('https://other.example/'), null);
  assert.equal(formEndpoint('testform'), 'https://formspree.io/f/testform');
});
test('posts only the intended fields and accepts confirmed success', async () => {
  let calls = 0;
  await sendContact(request, async (url, options) => {
    calls++;
    assert.equal(url, 'https://formspree.io/f/testform');
    assert.equal(options.method, 'POST');
    assert.deepEqual(JSON.parse(options.body), { email: 'visitor@example.com', message: 'Hello studio', _gotcha: '' });
    return { ok: true, json: async () => ({ ok: true }) };
  });
  assert.equal(calls, 1);
});
test('unconfigured, empty, oversized and honeypot submissions never reach the network', async () => {
  const fetcher = () => { assert.fail('Unexpected network request'); };
  for (const value of [{ ...request, formId: '' }, { ...request, message: ' ' }, { ...request, message: 'x'.repeat(5001) }, { ...request, honeypot: 'bot' }]) {
    await assert.rejects(sendContact(value, fetcher));
  }
});
test('HTTP failures and rate limits are not reported as success', async () => {
  await assert.rejects(sendContact(request, async () => ({ ok: false, status: 500 })), /rejected/);
  await assert.rejects(sendContact(request, async () => ({ ok: false, status: 429 })), /rate-limit/);
});
test('a successful HTTP response without confirmation is not a successful delivery', async () => {
  await assert.rejects(sendContact(request, async () => ({ ok: true, json: async () => ({ errors: ['invalid'] }) })), /rejected/);
});
test('network errors remain errors, with no automatic duplicate retry', async () => {
  let calls = 0;
  await assert.rejects(sendContact(request, async () => { calls++; throw new TypeError('offline'); }), /offline/);
  assert.equal(calls, 1);
});
