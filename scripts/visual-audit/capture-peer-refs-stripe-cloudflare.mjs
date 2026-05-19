#!/usr/bin/env node
/*
 * Capture Stripe Atlas + Cloudflare Architecture peer references for
 * Phase M ≥ 9.5 / 2-peer triangulation (spec D24 + M5).
 *
 * Uses Playwright bundled Chromium (no user-data-dir share — independent
 * of Founder's Chrome lock). Saves to:
 *   .claude/state/design-research/competitive-references/architecture-flows/
 *     - stripe-atlas-hero.png
 *     - cloudflare-blog-architecture.png
 *     - notes.md
 *
 * Use: node scripts/visual-audit/capture-peer-refs-stripe-cloudflare.mjs
 */
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, "..", "..");
const OUT = resolve(REPO, ".claude", "state", "design-research", "competitive-references", "architecture-flows");

const PAGES = [
  {
    name: "linear-command-palette",
    url: "https://linear.app/method",
    note: "Linear methodology marketing page — peer for command-palette aesthetic + dense list with hover-preview",
    waitUntil: "domcontentloaded",
  },
  {
    name: "notion-database-hover",
    url: "https://www.notion.com/help/intro-to-databases",
    note: "Notion databases explainer — peer for hover-preview pattern in dense list contexts",
    waitUntil: "domcontentloaded",
  },
  {
    name: "github-projects-board",
    url: "https://docs.github.com/en/issues/planning-and-tracking-with-projects/learning-about-projects/about-projects",
    note: "GitHub Projects explainer — peer for board-view dense interactive lists",
    waitUntil: "domcontentloaded",
  },
];

async function main() {
  await mkdir(OUT, { recursive: true });

  // Use Playwright bundled chromium with a UNIQUE user-data-dir per run
  // so this is independent of any other Playwright session.
  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled"],
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  const results = [];
  for (const p of PAGES) {
    try {
      console.log(`[peer-refs] navigating: ${p.url}`);
      await page.goto(p.url, { waitUntil: p.waitUntil || "networkidle", timeout: 60000 });
      await page.waitForTimeout(3000);
      const outPath = resolve(OUT, `${p.name}.png`);
      await page.screenshot({ path: outPath, fullPage: false });
      const stat = await import("node:fs").then((fs) => fs.statSync(outPath));
      results.push({ name: p.name, url: p.url, ok: true, bytes: stat.size, note: p.note });
      console.log(`[peer-refs] OK ${p.name} (${stat.size} bytes)`);
    } catch (e) {
      console.error(`[peer-refs] FAIL ${p.name}: ${e.message}`);
      results.push({ name: p.name, url: p.url, ok: false, error: e.message, note: p.note });
    }
  }

  await browser.close();

  // Write notes.md
  const notes = `# Architecture-flows peer references — 2026-05-18 session 2

Captured for Phase M5 ≥ 2-peer triangulation requirement (spec D24).

| Reference | URL | Note | Status |
|---|---|---|---|
${results
  .map((r) => `| ${r.name} | ${r.url} | ${r.note} | ${r.ok ? `✅ captured (${r.bytes} bytes)` : `❌ failed: ${r.error}`} |`)
  .join("\n")}

## Usage in TASTE-AUDIT scoring

These references join Janowiak ToDesktop (12 frames) as the peer set for main-flows.html.
Single-reference matching is FORBIDDEN per spec M5; triangulation against ≥ 2 peers required.

PARBAUGHS does NOT need to look like Stripe or Cloudflare. Each dimension scores against the BEST of the peer set per dimension.

## Files

${results.filter((r) => r.ok).map((r) => `- \`${r.name}.png\``).join("\n")}
`;

  await writeFile(resolve(OUT, "notes.md"), notes, "utf-8");
  console.log(`[peer-refs] wrote notes.md`);
  console.log(`[peer-refs] OUT: ${OUT}`);

  const failures = results.filter((r) => !r.ok);
  process.exit(failures.length > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("[peer-refs] FATAL:", e);
  process.exit(2);
});
