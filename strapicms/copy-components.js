const fs = require('fs');
const path = require('path');

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const srcDir = path.join(__dirname, 'src', 'components');
const destDir = path.join(__dirname, 'dist', 'src', 'components');

if (fs.existsSync(srcDir)) {
  copyDirRecursive(srcDir, destDir);
  console.log('Successfully copied components to dist/src/components');
} else {
  console.log('No components directory found in src/');
}
