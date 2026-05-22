import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext();
const page = await ctx.newPage();

const targets = [
  'https://parbaughs.sentry.io/',
  'https://sentry.io/organizations/parbaughs/',
  'https://sentry.io/organizations/parbaughs/issues/?project=4511434123116544'
];

for (const url of targets) {
  console.log('--- ' + url + ' ---');
  try {
    const r = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    console.log('  status: ' + r.status());
    console.log('  final url: ' + page.url());
    const title = await page.title();
    console.log('  title: ' + title);
    const body = await page.evaluate(() => (document.body.innerText || '').slice(0, 400));
    console.log('  body preview: ' + body.replace(/\n+/g, ' | ').slice(0, 400));
  } catch (e) { console.log('  ERROR: ' + e.message); }
  console.log('');
}
await b.close();
