const {test} = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const {assetPath, externalUrl} = require('./policy.cjs');
const root = path.resolve('app');
const files = new Set(['index.html', 'app.js', 'styles.css']);
test('only allowlisted packaged assets are served', () => {
  assert.equal(assetPath('daves-dollars://app/', root, files), path.join(root, 'index.html'));
  assert.equal(assetPath('daves-dollars://app/app.js?v=1', root, files), path.join(root, 'app.js'));
  for (const url of ['https://app/app.js','daves-dollars://other/app.js','daves-dollars://app/package.json','daves-dollars://app/%2e%2e%2fmain.cjs','daves-dollars://app/%5cmain.cjs','daves-dollars://app/%zz','daves-dollars://user@app/app.js']) assert.equal(assetPath(url,root,files),null,url);
});
test('external link policy excludes executable and local schemes', () => {
  assert.equal(externalUrl('https://www.census.gov/topics/income-poverty.html'), true);
  for (const url of ['file:///C:/test','javascript:alert(1)','data:text/html,x','https://user:pass@example.com','not a URL']) assert.equal(externalUrl(url),false);
});
