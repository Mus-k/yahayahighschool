const fs = require('fs');

const file = 'C:/Users/pc/YAHAYASCHOOL/frontend/app/[locale]/(dashboard)/finance/reports/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// The file has literals like \` instead of `
content = content.replace(/\\`/g, '`');

// The file has \${ instead of ${
content = content.replace(/\\\$\{/g, '${');

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed page.tsx');
