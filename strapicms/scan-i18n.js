const fs = require('fs');
const path = require('path');

function getFiles(dir) {
  let files = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      files = files.concat(getFiles(filePath));
    } else if (filePath.endsWith('schema.json')) {
      files.push(filePath);
    }
  });
  return files;
}

const apiDir = path.join(__dirname, 'src', 'api');
if (fs.existsSync(apiDir)) {
  const all = getFiles(apiDir);
  all.forEach(f => {
    const content = fs.readFileSync(f, 'utf8');
    const isLocalized = content.includes('"localized": true');
    const hasI18n = content.includes('i18n');
    console.log(`${path.relative(apiDir, f)}: localized=${isLocalized}, hasI18n=${hasI18n}`);
  });
} else {
  console.log('API directory not found');
}
