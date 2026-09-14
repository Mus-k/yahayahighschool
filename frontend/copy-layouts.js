const fs = NodeJS.require('fs');
const path = NodeJS.require('path');

const basePath = 'C:\\Users\\pc\\YAHAYASCHOOL\\frontend\\app\\[locale]\\(dashboard)';
const layoutFile = path.join(basePath, 'students', 'layout.tsx');

const adminFolders = ['parents', 'teachers', 'workers', 'erp', 'lms', 'qms', 'llms', 'academic-structure', 'directory'];

if (fs.existsSync(layoutFile)) {
  const content = fs.readFileSync(layoutFile, 'utf8');
  for (const folder of adminFolders) {
    const dest = path.join(basePath, folder, 'layout.tsx');
    if (fs.existsSync(path.join(basePath, folder))) {
      fs.writeFileSync(dest, content);
      console.log(`Copied layout to ${folder}`);
    }
  }
}
