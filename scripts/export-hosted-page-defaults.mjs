/**
 * Schreibt die Default-Page-Assets nach ext/page-assets/ für den Upload in die Sharetribe Console
 * (content/pages/terms-of-service.json und privacy-policy.json).
 */
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const { termsOfServicePageAsset } = await import(
  join(root, 'src/assets/hosted-page-defaults/termsOfServicePageAsset.js')
);
const { privacyPolicyPageAsset } = await import(
  join(root, 'src/assets/hosted-page-defaults/privacyPolicyPageAsset.js')
);

const outDir = join(root, 'ext', 'page-assets');
mkdirSync(outDir, { recursive: true });
writeFileSync(
  join(outDir, 'terms-of-service.json'),
  JSON.stringify(termsOfServicePageAsset, null, 2)
);
writeFileSync(join(outDir, 'privacy-policy.json'), JSON.stringify(privacyPolicyPageAsset, null, 2));

console.log('ext/page-assets/terms-of-service.json und privacy-policy.json aktualisiert.');
