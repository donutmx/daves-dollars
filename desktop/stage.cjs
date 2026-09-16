const fs = require('node:fs');
const path = require('node:path');
const source = path.resolve(__dirname, '../dist');
const target = path.join(__dirname, 'app');
fs.mkdirSync(target, {recursive:true});
const files = fs.readdirSync(source);
for (const name of fs.readdirSync(target)) {
  if (!files.includes(name)) fs.unlinkSync(path.join(target, name));
}
for (const name of files) {
  if (!/\.(html|css|js|png|svg|ico)$/.test(name) || !fs.statSync(path.join(source,name)).isFile()) throw new Error(`Unexpected public asset: ${name}`);
  fs.copyFileSync(path.join(source,name), path.join(target,name));
}
console.log(`Staged ${files.length} unchanged public assets.`);
