const fs = require('fs');
const path = require('path');

function getFiles(dir) {
  const subdirs = fs.readdirSync(dir);
  const files = subdirs.map(subdir => {
    const res = path.resolve(dir, subdir);
    return fs.statSync(res).isDirectory() ? getFiles(res) : res;
  });
  return Array.prototype.concat(...files);
}

const jsFiles = getFiles('C:/Users/pc/YAHAYASCHOOL/strapicms/src/api').filter(f => f.endsWith('.js'));
let renamedCount = 0;
for (const file of jsFiles) {
  const tsFile = file.slice(0, -3) + '.ts';
  fs.renameSync(file, tsFile);
  renamedCount++;
}
console.log(`Successfully converted ${renamedCount} .js files to .ts files in src/api!`);
