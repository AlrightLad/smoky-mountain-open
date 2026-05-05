// Smoke auth helper — real Firebase login via the dev server.
//
// Reads SMOKE_EMAIL + SMOKE_PASSWORD from env. The dev server (npm run dev)
// must be running and pointing at the production Parbaughs Firebase project
// (no ?emulator=1). Tests log in with the provided real credentials.
//
// Local-only by design. Do NOT commit credentials. Set them in your shell:
//   export SMOKE_EMAIL=zboogher@gmail.com
//   export SMOKE_PASSWORD=...
// or pass inline:
//   SMOKE_EMAIL=... SMOKE_PASSWORD=... npm run smoke

function readCreds() {
  var email = process.env.SMOKE_EMAIL || '';
  var password = process.env.SMOKE_PASSWORD || '';
  if (!email || !password) {
    throw new Error(
      'SMOKE_EMAIL and SMOKE_PASSWORD must be set in the environment.\n' +
      '  e.g.  SMOKE_EMAIL=you@example.com SMOKE_PASSWORD=... npm run smoke'
    );
  }
  return { email: email, password: password };
}

async function loginReal(page, devUrl) {
  var creds = readCreds();
  var url = devUrl || 'http://localhost:5173/';

  await page.goto(url);

  // Wait for Firebase compat SDK to initialise + auth screen to render.
  await page.waitForFunction(function() {
    return typeof window.firebase !== 'undefined'
        && typeof window.auth !== 'undefined';
  }, null, { timeout: 15000 });

  // Sign in via the compat SDK directly (faster + more reliable than driving
  // the auth UI in three browser engines).
  await page.evaluate(async function(c) {
    await window.auth.signInWithEmailAndPassword(c.email, c.password);
  }, creds);

  // Wait until enterApp() runs: #mainApp visible, #authScreen hidden.
  await page.waitForFunction(function() {
    var main = document.getElementById('mainApp');
    var auth = document.getElementById('authScreen');
    return main && !main.classList.contains('hidden')
        && auth && auth.classList.contains('hidden');
  }, null, { timeout: 20000 });

  // Settle so post-load home re-render completes.
  await page.waitForTimeout(500);
}

async function logout(page) {
  await page.evaluate(async function() {
    if (window.auth) await window.auth.signOut();
  });
  await page.waitForFunction(function() {
    var a = document.getElementById('authScreen');
    return a && !a.classList.contains('hidden');
  }, null, { timeout: 5000 });
}

module.exports = { loginReal, logout, readCreds };
