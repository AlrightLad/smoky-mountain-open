---
status: open
severity: yellow
priority: MEDIUM
authored_at: 2026-06-11T12:30:00Z
authored_by: agent
founder_action_required: true
gate: AMD-018 gate 1 (Cloud Functions deploy) + economy code (gate 4)
---

# ParCoin hardening — staged plan ("harden parcoin", approved 2026-06-11)

The pentest found two economy-integrity holes: a savvy member could (#16)
edit their own ParCoin balance, or (#17) grant themselves a cosmetic free,
because balances + ownership are written by the client. ParCoin is
cosmetic-only/zero-cash-value, so the worst case is an unearned avatar
ring in a 20-person trusted club — but you approved hardening it, so here's
the honest, staged plan that doesn't risk the live economy.

## Stage 1 — free-cosmetics (#17). CODE-READY, awaiting your deploy.

The clean, contained half. Built and tested-ready:
- **`purchaseCosmetic` Cloud Function** (functions/index.js): the only path
  that may add to `ownedCosmetics` / deduct ParCoin for a purchase. Reads
  the authoritative price from `shop_catalog/{itemId}` (server-side),
  refuses reserved/arriving/earned items, idempotent per (uid,item),
  atomic transaction.
- **`scripts/seed-shop-catalog.mjs`** — seeds `shop_catalog` prices from the
  client catalog. Run once before the deploy + after any catalog change.

### Your steps for Stage 1 (one session, ~5 min):
1. Seed the catalog both projects:
   ```powershell
   node scripts/seed-shop-catalog.mjs parbaughs-staging
   node scripts/seed-shop-catalog.mjs parbaughs
   ```
2. Deploy the function:
   ```powershell
   firebase deploy --only functions:purchaseCosmetic --project parbaughs --force
   ```
3. Tell the agent **"purchaseCosmetic deployed"**. The agent then ships the
   client shim (shop.js calls the function, falls back to the old path only
   if it's somehow unavailable) + flips the rule to lock `ownedCosmetics`
   to function-only, runs the rules tests, and verifies a purchase end to
   end. (The shim is held until the function exists so a purchase never
   errors in the gap.)

## Stage 2 — coin minting (#16). Larger project, your call on scope.

True balance-authority means **every** way to earn a coin (round complete,
attested bonus, PB, range session, daily login, achievements, invites,
wager/bounty payouts — ~18 reasons) must be re-derived and granted by a
server function, because the server can't trust a client-sent amount. That's
a multi-step build (a `grantCoins` function that reads the round/event and
computes the award, per reason) and it changes offline behavior (earns would
need connectivity). `awardCoins`/`deductCoins` are single client helpers
(good — the rewire is contained to two functions), but the server-side
award-derivation is the real work.

**Recommendation:** ship Stage 1 now (closes the cleaner exploit), then scope
Stage 2 as its own focused project when you want it — or accept #16 as
low-risk given cosmetic-only coins + a trusted league. Reply **"do stage 2"**
to queue the full earn-side rebuild, or **"stage 1 only"** to stop there.

Nothing here is deployed yet; the live economy is unchanged.
