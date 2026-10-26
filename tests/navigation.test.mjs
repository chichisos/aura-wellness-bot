import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const bundle = await build({
  stdin: { contents: 'export { handleCallback, handleMessage } from "./src/handlers"; export * from "./src/telegram"; export * from "./src/data";', resolveDir: process.cwd() },
  bundle: true, write: false, format: 'esm', platform: 'neutral',
});
const scratch = await mkdtemp(join(tmpdir(), 'aura-navigation-'));
let app;
try {
  const target = join(scratch, 'app.mjs');
  await writeFile(target, bundle.outputFiles[0].text);
  app = await import(pathToFileURL(target).href);
} finally {
  await rm(scratch, { recursive: true, force: true });
}

function telegram() {
  const messages = new Map(), calls = [], kv = new Map();
  let nextId = 1, failure;
  const env = { BOT_TOKEN: 'local-test-marker', ADMIN_CHAT_ID: '-10042', BOT_STATE: {
    async get(key) { return kv.get(key) ?? null; },
    async put(key, value) { kv.set(key, value); },
    async delete(key) { kv.delete(key); },
  } };
  const respond = (result, status = 200) => new Response(JSON.stringify(result), { status });
  return { env, messages, calls, kv,
    fail(method, description, code = 400, status = 400) { failure = { method, description, code, status }; },
    async fetch(url, options) {
      const method = new URL(url).pathname.split('/').at(-1), body = JSON.parse(options.body);
      calls.push({ method, body });
      if (failure?.method === method) {
        const f = failure; failure = undefined;
        return respond({ ok: false, error_code: f.code, description: f.description }, f.status);
      }
      let result = true;
      if (method === 'sendPhoto' || method === 'sendMessage') {
        result = { message_id: nextId++, chat: { id: body.chat_id }, reply_markup: body.reply_markup };
        if (method === 'sendPhoto') {
          result.photo = [{ file_id: body.photo }]; result.caption = body.caption;
          assert.ok(body.caption.replace(/<[^>]*>/g, "").replace(/&amp;/g, "_").length <= 1024);
        } else result.text = body.text;
        messages.set(result.message_id, result);
      } else if (method === 'deleteMessage') {
        assert.ok(messages.delete(body.message_id), 'must delete an existing message');
      } else if (method.startsWith('editMessage')) {
        const message = messages.get(body.message_id);
        assert.ok(message, 'must edit the current message_id');
        if (method === 'editMessageMedia') {
          assert.ok(message.photo, 'photo-to-photo transitions must edit media');
          assert.equal(body.media.type, 'photo');
          assert.equal(body.media.parse_mode, 'HTML');
          assert.ok(body.media.caption.length <= 1024);
          message.photo = [{ file_id: body.media.media }]; message.caption = body.media.caption;
        } else {
          assert.ok(!message.photo, 'cannot editMessageText on a photo');
          message.text = body.text;
        }
        message.reply_markup = body.reply_markup;
        result = message;
      } else assert.equal(method, 'answerCallbackQuery');
      return respond({ ok: true, result });
    },
  };
}

test('Telegram navigation and failure handling', async t => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  let api;
  const reset = () => { api = telegram(); globalThis.fetch = api.fetch; };
  const start = async () => {
    await app.handleMessage(api.env, { message_id: 100, chat: { id: 42 }, from: { id: 42 }, text: '/start' });
    return [...api.messages.values()].at(-1);
  };
  const click = async (message, data) => {
    const offset = api.calls.length;
    await app.handleCallback(api.env, { id: 'callback', from: { id: 42 }, message: structuredClone(message), data });
    assert.equal(api.calls[offset].method, 'answerCallbackQuery');
    return [...api.messages.values()].at(-1);
  };

  await t.test('/start keeps its welcome photo and separate working menu', async () => {
    reset(); const menu = await start();
    assert.equal(api.messages.size, 2);
    assert.deepEqual(api.calls.map(c => c.method), ['sendPhoto', 'sendMessage']);
    assert.ok(api.messages.get(1).photo[0].file_id.endsWith('5393427297198611569.jpg'));
    assert.equal(menu.text, app.WELCOME_TEXT);
    assert.ok(menu.reply_markup.inline_keyboard.length);
  });

  await t.test('services, all categories/cards, promos, back, home and repeated transitions leave one navigation message', async () => {
    reset(); let current = await start();
    const welcome = structuredClone(api.messages.get(1));
    for (let repeat = 0; repeat < 3; repeat++) {
      current = await click(current, 'menu:services');
      for (const category of app.CATEGORIES) {
        current = await click(current, `cat:${category.id}`);
        const photoId = current.message_id;
        const sends = api.calls.filter(c => c.method === 'sendPhoto').length;
        for (const service of app.servicesByCategory(category.id)) {
          current = await click(current, `svc:${service.id}`);
          assert.equal(current.message_id, photoId);
          assert.ok(current.caption.includes(app.esc(service.description)));
          assert.equal(current.reply_markup.inline_keyboard[0][0].callback_data, `booksvc:${service.id}`);
        }
        current = await click(current, `cat:${category.id}`);
        assert.equal(api.calls.filter(c => c.method === 'sendPhoto').length, sends);
        assert.equal(api.messages.size, 2);
      }
      const photoId = current.message_id;
      current = await click(current, 'menu:promos');
      assert.equal(current.message_id, photoId);
      for (const promo of app.PROMOS) assert.ok(current.caption.includes(app.esc(promo.text)));
      current = await click(current, 'menu:promos');
      assert.equal(current.message_id, photoId);
      current = await click(current, 'menu:home');
      assert.ok(!current.photo);
      assert.ok(!api.messages.has(photoId));
      current = await click(current, 'menu:services');
      current = await click(current, 'cat:massage');
      current = await click(current, 'menu:services'); // actual back button
      assert.ok(!current.photo);
      assert.equal(api.messages.size, 2);
      assert.equal([...api.messages.values()].filter(m => m.photo).length, 1, 'only the original welcome photo remains');
      assert.deepEqual(api.messages.get(1), welcome);
    }
  });

  await t.test('team cards, promo booking, booking dates, cancellation, FAQ and reviews', async () => {
    reset(); let current = await start();
    for (const data of ['menu:team', 'team:anna', 'menu:team', 'team:maria', 'bookspec:maria', 'bsvc:glow-therapy', 'menu:home', 'menu:promos', 'promo:book', 'bsvc:relax', 'bspec:any', 'book:cancel', 'menu:faq', 'faq:prepare', 'menu:reviews', 'reviews:leave', 'menu:home']) {
      current = await click(current, data);
      assert.equal(api.messages.size, 2);
    }
  });

  await t.test('identical edits are harmless; other API errors do not create fallback photos', async () => {
    reset(); let current = await start();
    current = await click(current, 'cat:massage');
    const calls = api.calls.length;
    api.fail('editMessageMedia', 'Bad Request: message is not modified');
    await click(current, 'cat:massage');
    assert.deepEqual(api.calls.slice(calls).map(c => c.method), ['answerCallbackQuery', 'editMessageMedia']);
    api.fail('editMessageMedia', 'Too Many Requests', 429, 429);
    await assert.rejects(click(current, 'menu:promos'), /429/);
    assert.equal(api.messages.size, 2);
    api.fail('sendMessage', 'rejected in JSON despite HTTP 200', 400, 200);
    await assert.rejects(click(current, 'menu:home'), /rejected in JSON/);
    assert.ok(api.messages.has(current.message_id), 'send failure preserves old screen');
  });

  await t.test('replacement deletion failure rolls back new photo and preserves old menu', async () => {
    reset(); const current = await start();
    api.fail('deleteMessage', 'message cannot be deleted');
    await assert.rejects(click(current, 'cat:massage'), /cannot be deleted/);
    assert.equal(api.messages.size, 2);
    assert.ok(api.messages.has(current.message_id));
    assert.deepEqual(api.calls.slice(-3).map(c => c.method), ['sendPhoto', 'deleteMessage', 'deleteMessage']);
  });

  await t.test('expired callback acknowledgement still permits navigation; inline callbacks are acknowledged', async () => {
    reset(); const current = await start();
    api.fail('answerCallbackQuery', 'query is too old');
    const originalError = console.error;
    try {
      console.error = () => {};
      const result = await click(current, 'cat:spa');
      assert.ok(result.photo);
      assert.equal(api.messages.size, 2);
    } finally { console.error = originalError; }
    const offset = api.calls.length;
    await app.handleCallback(api.env, { id: 'inline-only', from: { id: 42 }, data: 'menu:home' });
    assert.deepEqual(api.calls.slice(offset).map(c => c.method), ['answerCallbackQuery']);
  });

  await t.test('network failures never expose the bot token', async () => {
    reset();
    globalThis.fetch = async () => { throw new Error(`network failure: ${api.env.BOT_TOKEN}`); };
    await assert.rejects(app.sendMessage(api.env, 42, 'local'), error => {
      assert.ok(!error.message.includes(api.env.BOT_TOKEN));
      assert.match(error.message, /Network request failed/);
      return true;
    });
  });

  await t.test('caption limit is checked before mutation, parsed entities do not count as markup', async () => {
    reset(); const current = await start();
    const keyboard = current.reply_markup, offset = api.calls.length;
    await assert.rejects(app.renderSection(api.env, current, 'я'.repeat(1025), keyboard, 'photo'), /1024/);
    assert.equal(api.calls.length, offset);
    await app.renderSection(api.env, current, `<b>${'&amp;'.repeat(1024)}</b>`, keyboard, 'photo');
    assert.equal(api.messages.size, 2);
  });
});
