#!/usr/bin/env node
/* Encrypt the participants-only content of the OMNI 2026 site (no extra packages needed).

   The plaintext originals live in private/ (never committed). This writes encrypted copies into the
   published folders; the browser decrypts them after the visitor enters the seminar password
   (assets/secure.js).

     private/proceedings/OMNI2026_Proceedings.pdf -> proceedings/OMNI2026_Proceedings.pdf.enc
     private/papers/<id>.pdf                      -> proceedings/papers/<id>.pdf.enc
     private/pages/<id>-<n>.jpg                   -> assets/pages/<id>-<n>.jpg.enc
     private/papers-html/<id>.json                -> assets/papers-html/<id>.json.enc
     private/secure-main.json                     -> assets/secure/main.json.enc

   Format (Web Crypto compatible): key = PBKDF2-SHA256(password, salt, ITER) -> AES-256-GCM;
   each file = 12-byte IV || ciphertext || 16-byte tag. Salt, iterations and a check value go in
   assets/secure/meta.json.

   Usage:  node tools/encrypt.mjs                 (asks for the password, input hidden)
           OMNI_PASSWORD=... node tools/encrypt.mjs
*/
import { createCipheriv, pbkdf2Sync, randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ITER = 600000;
const CHECK = Buffer.from('omni2026-ok');

const JOBS = [
  ['private/proceedings', /^OMNI2026_Proceedings\.pdf$/, 'proceedings'],
  ['private/papers', /\.pdf$/, 'proceedings/papers'],
  ['private/pages', /\.jpg$/, 'assets/pages'],
  ['private/papers-html', /\.json$/, 'assets/papers-html'],
  ['private', /^secure-main\.json$/, 'assets/secure', 'main.json'],
];

function askHidden(prompt) {
  return new Promise((resolve) => {
    process.stdout.write(prompt);
    const stdin = process.stdin;
    let value = '';
    stdin.setRawMode && stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    stdin.on('data', function onData(ch) {
      if (ch === '\r' || ch === '\n' || ch === '\u0004') {
        stdin.setRawMode && stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener('data', onData);
        process.stdout.write('\n');
        resolve(value);
      } else if (ch === '\u0003') {
        process.exit(1);
      } else if (ch === '\u007f') {
        value = value.slice(0, -1);
      } else {
        value += ch;
      }
    });
  });
}

function seal(key, data) {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', key, iv);
  return Buffer.concat([iv, c.update(data), c.final(), c.getAuthTag()]);
}

const password = process.env.OMNI_PASSWORD || (await askHidden('Seminar password: '));
if (password.length < 8) { console.error('password too short'); process.exit(1); }
const salt = randomBytes(16);
const key = pbkdf2Sync(Buffer.from(password, 'utf8'), salt, ITER, 32, 'sha256');

// remove stale encrypted files so deleted papers do not linger
for (const [, , dst] of JOBS) {
  const dir = join(ROOT, dst);
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir)) if (f.endsWith('.enc')) rmSync(join(dir, f));
}

let count = 0;
for (const [src, pattern, dst, rename] of JOBS) {
  const dir = join(ROOT, src);
  if (!existsSync(dir)) continue;
  mkdirSync(join(ROOT, dst), { recursive: true });
  for (const f of readdirSync(dir).sort()) {
    if (!pattern.test(f)) continue;
    const out = join(ROOT, dst, (rename || basename(f)) + '.enc');
    writeFileSync(out, seal(key, readFileSync(join(dir, f))));
    count++;
  }
}

const meta = {
  v: 1,
  kdf: 'PBKDF2-SHA256',
  iter: ITER,
  salt: salt.toString('base64'),
  check: seal(key, CHECK).toString('base64'),
};
writeFileSync(join(ROOT, 'assets/secure/meta.json'), JSON.stringify(meta, null, 1) + '\n');
console.log(`encrypted ${count} files; wrote assets/secure/meta.json`);
