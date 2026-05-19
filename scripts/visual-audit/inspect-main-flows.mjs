import { chromium } from "playwright";
import path from "node:path";
import { pathToFileURL } from "node:url";

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const fileUrl = pathToFileURL(path.resolve("docs/reports/main-flows.html")).toString();
  await page.goto(fileUrl, { waitUntil: "load" });
  await page.waitForTimeout(800);
  await page.locator(".mf-flows-item").first().click();
  await page.waitForTimeout(1000);
  // Move mouse away to clear any lingering hover tooltip
  await page.mouse.move(10, 10);
  await page.waitForTimeout(300);

  // Capture the architecture diagram + title at 2x for legibility
  const ws = page.locator(".mf-workspace");
  const box = await ws.boundingBox();
  await page.screenshot({
    path: ".claude/state/main-flows-v2/inspect-arch-2x.png",
    clip: { x: 0, y: Math.max(0, box.y - 80), width: 1920, height: Math.min(1080, box.height + 100) }
  });

  // Capture title only
  const title = page.locator(".pb-page-title-row");
  const tbox = await title.boundingBox();
  if (tbox) {
    await page.screenshot({
      path: ".claude/state/main-flows-v2/inspect-title-2x.png",
      clip: { x: 0, y: tbox.y - 20, width: 1920, height: tbox.height + 40 }
    });
  }

  // Inspect: do column-header elements have zero visible footprint?
  const headers = await page.evaluate(() => {
    const els = document.querySelectorAll(".mf-column-header");
    return Array.from(els).map(el => ({
      text: el.textContent,
      label: el.getAttribute("data-col-label"),
      rect: el.getBoundingClientRect(),
      computed: { height: getComputedStyle(el).height, fontSize: getComputedStyle(el).fontSize, position: getComputedStyle(el).position }
    }));
  });
  console.log("column-headers:", JSON.stringify(headers, null, 2));

  // Inspect: legend chips - what are they?
  const legend = await page.evaluate(() => {
    const items = document.querySelectorAll(".mf-legend-item");
    return Array.from(items).map(el => ({
      text: el.textContent,
      rect: el.getBoundingClientRect()
    }));
  });
  console.log("legend:", JSON.stringify(legend, null, 2));

  // Inspect: first node in each column for first-row content
  const firstNodes = await page.evaluate(() => {
    const cols = document.querySelectorAll(".mf-column");
    return Array.from(cols).map(col => {
      const first = col.querySelector(".mf-node");
      return first ? { label: first.querySelector(".mf-node-label")?.textContent, subtitle: first.querySelector(".mf-node-subtitle")?.textContent, rect: first.getBoundingClientRect() } : null;
    });
  });
  console.log("first-nodes:", JSON.stringify(firstNodes, null, 2));

  await browser.close();
})();
