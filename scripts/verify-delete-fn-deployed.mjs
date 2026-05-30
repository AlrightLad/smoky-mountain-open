#!/usr/bin/env node
// Verify the deleteMyAccount Cloud Function is deployed + reachable in PRODUCTION.
//
// Non-destructive: sends only a CORS preflight (OPTIONS) from an allow-listed
// origin. A deployed function answers the preflight with 204 + the CORS
// headers; an undeployed function URL returns 404. No bearer token, no body,
// so nothing can be deleted by this probe.
//
// Prints "PASS" on success (founder-mark-complete.ps1 matches verify_expected).

const ENDPOINT =
  "https://us-central1-parbaughs.cloudfunctions.net/deleteMyAccount";
const ORIGIN = "https://alrightlad.github.io";

async function main() {
  let res;
  try {
    res = await fetch(ENDPOINT, {
      method: "OPTIONS",
      headers: {
        Origin: ORIGIN,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "authorization,content-type",
      },
    });
  } catch (err) {
    console.error(`FAIL — could not reach ${ENDPOINT}: ${err.message}`);
    process.exit(1);
  }

  const allowOrigin = res.headers.get("access-control-allow-origin");

  if (res.status === 404) {
    console.error(
      "FAIL — endpoint returned 404. deleteMyAccount is NOT deployed to " +
        "production yet. Run: firebase deploy --only " +
        "functions:deleteMyAccount --project parbaughs"
    );
    process.exit(1);
  }

  if (res.status === 204 && allowOrigin) {
    console.log(
      `PASS — deleteMyAccount is deployed and reachable ` +
        `(OPTIONS ${res.status}, allow-origin: ${allowOrigin}).`
    );
    return;
  }

  // Any other 2xx/4xx that isn't 404 still proves the function exists (it ran
  // and responded), but flag the unexpected shape so it gets a human look.
  console.error(
    `FAIL — unexpected preflight response (status ${res.status}, ` +
      `allow-origin: ${allowOrigin ?? "none"}). The function may be deployed ` +
      `but its CORS handling changed; verify manually.`
  );
  process.exit(1);
}

main();
