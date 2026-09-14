const fs = NodeJS.require('fs');
const path = NodeJS.require('path');

const baseDir = path.join(__dirname, 'app', '[locale]', '(dashboard)', 'dashboard');
const roles = fs.readdirSync(baseDir).filter(f => fs.statSync(path.join(baseDir, f)).isDirectory());

roles.forEach(role => {
  if (role === 'admin') return;
  const f = path.join(baseDir, role, 'page.tsx');
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf-8');

    // Replace <PageContainer title="..." description="..."> with <PageContainer><PageHeader title="..." description="..." />
    // Also we need to import PageHeader
    if (!content.includes('PageHeader')) {
      content = content.replace('PageContainer }', 'PageContainer, PageHeader }');
    }

    // regex to replace <PageContainer title=... description=...> with <PageContainer>\n<PageHeader title=... description=... />
    content = content.replace(/<PageContainer title=\"(.*?)\" description=\{`([^`]+)`\}>/g, '<PageContainer>\n      <PageHeader title="$1" description={`$2`} />');

    fs.writeFileSync(f, content);
  }
});
console.log('Fixed PageContainer syntax.');
