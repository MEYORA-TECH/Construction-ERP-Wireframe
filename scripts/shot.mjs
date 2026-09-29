// Usage: node scripts/shot.mjs <outDir> <width> <hashPath> [<hashPath> ...]
import { chromium } from 'playwright';
const [, , outDir, width, ...paths] = process.argv;
const base = process.env.BASE_URL ?? 'http://localhost:5173/';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(width) || 1440, height: 900 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
for (const p of paths) {
  await page.goto(`${base}#${p}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  const name = (p.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'home') + `_${width}.png`;
  await page.screenshot({ path: `${outDir}/${name}`, fullPage: process.env.FULL === '1' });
  console.log('saved', name);
}
if (errors.length) console.log('ERRORS:\n' + errors.join('\n'));
await browser.close();
