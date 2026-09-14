const fs = NodeJS.require('fs');
const path = NodeJS.require('path');

const baseDir = path.join(__dirname, 'app', '[locale]', '(dashboard)', 'dashboard');
const roles = fs.readdirSync(baseDir).filter(f => fs.statSync(path.join(baseDir, f)).isDirectory());

roles.forEach(role => {
  const f = path.join(baseDir, role, 'page.tsx');
  if (fs.existsSync(f)) {
    const content = fs.readFileSync(f, 'utf-8');
    const fixed = content.replace(/description=\"Welcome back, \" \+ user\?\.firstName>/g, 'description={`Welcome back, ${user?.firstName}`}>');
    fs.writeFileSync(f, fixed);
  }
});
console.log('Fixed JSX syntax.');
