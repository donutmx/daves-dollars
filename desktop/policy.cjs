const path = require('node:path');
function assetPath(raw, root, files) {
  try {
    const url = new URL(raw);
    if (url.protocol !== 'daves-dollars:' || url.host !== 'app' || url.username || url.password) return null;
    const name = decodeURIComponent(url.pathname).replace(/^\//, '') || 'index.html';
    if (!files.has(name) || name.includes('\\') || name.split('/').some(x => x === '..' || x === '.')) return null;
    return path.join(root, name);
  } catch { return null; }
}
function externalUrl(raw) {
  try { const url = new URL(raw); return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password; }
  catch { return false; }
}
module.exports = { assetPath, externalUrl };
