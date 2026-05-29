// Verifies the reworked account-deletion flow (branded bottom-sheet +
// reauth-first + typed-confirm) against the local emulator. Proves two
// properties that matter for App Store 5.1.1(v) / GDPR + the half-delete bug:
//   SAFETY:  wrong password => nothing is deleted (member doc survives).
//   ERASURE: correct password => member doc + photo + auth user all gone.
// Uses a throwaway email/password user so the real test_zach_uid_01 custom-
// token user is untouched (custom-token can't exercise EmailAuthProvider reauth).

import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';

const OUT = '.claude/state/design-pass-2026-05-22/delete-account-2026-05-29';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.GCLOUD_PROJECT = 'parbaughs';

const admin = (await import('firebase-admin')).default;
if (!admin.apps.length) admin.initializeApp({ projectId: 'parbaughs' });

const UID = 'del_test_uid_2905';
const EMAIL = 'deltest2905@parbaughs.test';
const PW = 'Test123!delete';

// Fresh user each run.
try { await admin.auth().deleteUser(UID); } catch (e) {}
await admin.auth().createUser({ uid: UID, email: EMAIL, password: PW, emailVerified: true });
await admin.firestore().collection('members').doc(UID).set({
  name: 'Delete Test', username: 'deltest', uid: UID, joinedAt: new Date().toISOString(),
});
await admin.firestore().collection('photos').add({ uploadedBy: UID, url: 'x', caption: 'test' });

const results = [];
function rec(name, pass, detail) { results.push({ name, pass, detail: detail || '' }); console.log((pass ? '  PASS ' : '  FAIL ') + name + (detail ? ' :: ' + detail : '')); }

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
page.on('console', m => { if (m.type() === 'error') console.log('  [page-err] ' + m.text().slice(0, 120)); });

await page.goto('http://localhost:5173/?emulator=1');
await page.waitForFunction(() => typeof window.auth !== 'undefined' && window._pbEmulator === true, { timeout: 15000 });
await page.evaluate(async ({ email, pw }) => { await window.auth.signInWithEmailAndPassword(email, pw); }, { email: EMAIL, pw: PW });
await page.waitForFunction(() => !document.getElementById('mainApp')?.classList.contains('hidden'), { timeout: 15000 });
await page.waitForTimeout(1200);

await page.evaluate(() => Router.go('settings'));
await page.waitForTimeout(1400);

// Open the deletion sheet.
const delBtn = page.locator('button', { hasText: 'Delete My Account' }).first();
await delBtn.scrollIntoViewIfNeeded();
await delBtn.click();
await page.waitForSelector('#delAcctConfirm', { timeout: 5000 });
await page.waitForTimeout(700);
await page.screenshot({ path: OUT + '/01-sheet-opened.png', fullPage: false });

const disabledInitially = await page.evaluate(() => document.getElementById('delAcctConfirm').disabled);
rec('Delete button disabled on open', disabledInitially === true, 'disabled=' + disabledInitially);

// Type WRONG password + confirm word -> button enables.
await page.fill('#delAcctPw', 'totallywrongpw');
await page.fill('#delAcctWord', 'DELETE');
await page.waitForTimeout(300);
const enabledAfterFill = await page.evaluate(() => document.getElementById('delAcctConfirm').disabled === false);
rec('Delete button enables after password + DELETE typed', enabledAfterFill, 'enabled=' + enabledAfterFill);
await page.screenshot({ path: OUT + '/02-filled-wrong-pw.png', fullPage: false });

// Click delete with wrong password -> reauth fails -> error, nothing deleted.
await page.click('#delAcctConfirm');
await page.waitForTimeout(2500);
const errText = await page.evaluate(() => { var e = document.getElementById('delAcctErr'); return e && e.style.display !== 'none' ? e.textContent : ''; });
rec('Wrong password shows error', /not correct|Nothing was deleted/i.test(errText), JSON.stringify(errText));
await page.screenshot({ path: OUT + '/03-wrong-pw-error.png', fullPage: false });

const memberStillThere = (await admin.firestore().collection('members').doc(UID).get()).exists;
rec('SAFETY: member doc survives wrong password', memberStillThere === true, 'exists=' + memberStillThere);
let authStillThere = true;
try { await admin.auth().getUser(UID); } catch (e) { authStillThere = false; }
rec('SAFETY: auth user survives wrong password', authStillThere === true, 'exists=' + authStillThere);

// Now correct password -> full erasure.
await page.fill('#delAcctPw', PW);
await page.fill('#delAcctWord', 'DELETE');
await page.waitForTimeout(300);
await page.click('#delAcctConfirm');
await page.waitForTimeout(3500);
await page.screenshot({ path: OUT + '/04-after-delete.png', fullPage: false });

const memberGone = !(await admin.firestore().collection('members').doc(UID).get()).exists;
rec('ERASURE: member doc deleted', memberGone, 'gone=' + memberGone);
const photoSnap = await admin.firestore().collection('photos').where('uploadedBy', '==', UID).get();
rec('ERASURE: photos deleted', photoSnap.empty, 'remaining=' + photoSnap.size);
let authGone = false;
try { await admin.auth().getUser(UID); } catch (e) { authGone = true; }
rec('ERASURE: auth user deleted', authGone, 'gone=' + authGone);

await b.close();

// Cleanup any residue if the happy path didn't complete.
try { await admin.auth().deleteUser(UID); } catch (e) {}

const failed = results.filter(r => !r.pass);
console.log('\n' + (results.length - failed.length) + '/' + results.length + ' checks passed. Shots -> ' + OUT);
if (failed.length) { console.log('FAILURES:'); failed.forEach(f => console.log('  ' + f.name + ' :: ' + f.detail)); process.exitCode = 1; }
