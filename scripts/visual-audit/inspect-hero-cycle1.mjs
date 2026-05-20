import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const url = pathToFileURL(resolve(process.cwd(), 'docs/reports/dashboard.html')).href;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(url);
await page.waitForLoadState('networkidle');
await page.waitForTimeout(500);

const result = await page.evaluate(() => {
  const card = document.querySelector('.pb-kpi-card.is-hero');
  if (!card) return { error: 'no hero card' };
  const value = card.querySelector('.pb-kpi-value');
  const valueRect = value ? value.getBoundingClientRect() : null;
  const valueComputed = value ? getComputedStyle(value) : null;
  const unit = card.querySelector('.pb-kpi-value-unit');
  const unitRect = unit ? unit.getBoundingClientRect() : null;
  return {
    cardWidth: card.getBoundingClientRect().width,
    valueHTML: value ? value.innerHTML : null,
    valueText: value ? value.textContent : null,
    valueFontSize: valueComputed ? valueComputed.fontSize : null,
    valueRect: valueRect ? { width: valueRect.width, height: valueRect.height } : null,
    unitFontSize: unit ? getComputedStyle(unit).fontSize : null,
    unitText: unit ? unit.textContent : null,
    unitRect: unitRect ? { width: unitRect.width, height: unitRect.height } : null,
    sparkExists: !!card.querySelector('[data-spark]'),
    sparkChildren: card.querySelector('[data-spark]')?.childElementCount,
    deltaHidden: card.querySelector('[data-kpi-delta]')?.hidden,
    deltaHTML: card.querySelector('[data-kpi-delta]')?.innerHTML
  };
});

console.log(JSON.stringify(result, null, 2));
await browser.close();
