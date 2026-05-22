import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distClientPath = path.resolve(__dirname, '../dist/client');
const indexHtmlPath = path.join(distClientPath, 'index.html');
const notFoundHtmlPath = path.join(distClientPath, '404.html');

try {
  // Read the assets directory to find the main JS bundle
  const assetsPath = path.join(distClientPath, 'assets');
  const assets = fs.readdirSync(assetsPath);
  const mainJs = assets.find(f => f.startsWith('index-') && f.endsWith('.js'));
  const mainCss = assets.find(f => f.startsWith('styles-') && f.endsWith('.css'));

  if (!mainJs) {
    throw new Error('Main JS bundle not found in assets');
  }

  console.log('Creating index.html for GitHub Pages...');
  const indexContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Worthly - Personal Finance</title>
  <link rel="icon" type="image/svg+xml" href="/personal-finance/favicon.svg">
  ${mainCss ? `<link rel="stylesheet" href="/personal-finance/assets/${mainCss}">` : ''}
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/personal-finance/assets/${mainJs}"></script>
</body>
</html>`;
  fs.writeFileSync(indexHtmlPath, indexContent);
  console.log('✓ Created index.html');

  // Create 404.html that redirects to index.html for SPA routing
  console.log('Creating 404.html for SPA routing...');
  const notFoundContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Redirecting...</title>
  <noscript>
    <meta http-equiv="refresh" content="0;url=/personal-finance/">
  </noscript>
  <script>
    window.location.href = '/personal-finance/';
  </script>
</head>
<body>
  <p>Redirecting to <a href="/personal-finance/">/personal-finance/</a>...</p>
</body>
</html>`;
  fs.writeFileSync(notFoundHtmlPath, notFoundContent);
  console.log('✓ Created 404.html for SPA routing');

  console.log('✓ Post-build for GitHub Pages completed successfully');
} catch (error) {
  console.error('✗ Post-build failed:', error);
  process.exit(1);
}
