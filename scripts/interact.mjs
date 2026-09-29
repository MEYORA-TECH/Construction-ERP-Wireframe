// Interaction smoke test with screenshots. Usage: node scripts/interact.mjs <outDir>
import { chromium } from 'playwright';
const outDir = process.argv[2];
const base = process.env.BASE_URL ?? 'http://localhost:5173/';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
const shot = async (n) => { await page.waitForTimeout(400); await page.screenshot({ path: `${outDir}/i_${n}.png` }); console.log('saved', n); };

await page.goto(`${base}#/project`, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: 'All applications' }).click();
await shot('switcher');
await page.keyboard.press('Escape');

await page.goto(`${base}#/project/project-setup/team`, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: /Add Team Member/ }).click();
await shot('modal');
await page.getByRole('button', { name: 'Save' }).click();
await shot('modal_validation');
await page.keyboard.press('Escape');

await page.keyboard.press('Control+k');
await page.keyboard.type('skyline');
await shot('search');
await page.keyboard.press('Escape');

await page.goto(`${base}#/project/planning-and-control/issues`, { waitUntil: 'networkidle' });
await page.getByRole('tab', { name: /Board/ }).click();
await shot('board');

if (errors.length) console.log('ERRORS:\n' + errors.join('\n'));
await browser.close();
