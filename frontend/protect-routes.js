const fs = require('fs');
const path = require('path');

const basePath = 'C:\\Users\\pc\\YAHAYASCHOOL\\frontend\\app\\[locale]\\(dashboard)';

// Helper to determine allowed roles based on folder path
function getAllowedRoles(folderPath) {
  const p = folderPath.toLowerCase();
  
  // Explicit role endpoints
  if (p.includes('teacher')) return ['super_admin', 'director', 'teacher'];
  if (p.includes('student')) return ['super_admin', 'director', 'teacher', 'student'];
  if (p.includes('parent')) return ['super_admin', 'director', 'parent'];
  if (p.includes('worker')) return ['super_admin', 'director', 'worker'];
  if (p.includes('accountant')) return ['super_admin', 'director', 'accountant'];
  if (p.includes('account-lead')) return ['super_admin', 'director', 'account_lead'];
  if (p.includes('driver')) return ['super_admin', 'director', 'driver'];
  if (p.includes('director')) return ['super_admin', 'director'];
  if (p.includes('admin')) return ['super_admin', 'system_admin'];
  
  // General modules
  if (p.includes('results') || p.includes('qms') || p.includes('llms') || p.includes('lms')) {
    // Academic stuff - usually broadly accessible, but specific pages might be restricted.
    // For now, allow all school roles for the general layout, and rely on sub-layouts.
    return ['super_admin', 'system_admin', 'director', 'teacher', 'student', 'parent'];
  }
  
  if (p.includes('erp') || p.includes('academic-structure') || p.includes('directory') || p.includes('workers')) {
    return ['super_admin', 'system_admin', 'director'];
  }

  // Fallback
  return ['super_admin', 'system_admin', 'director'];
}

function walkSync(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkSync(file));
    } else {
      results.push(file);
    }
  });
  return results;
}

const allFiles = walkSync(basePath);
const pageFiles = allFiles.filter(f => f.endsWith('page.tsx'));

let count = 0;
for (const pageFile of pageFiles) {
  const dir = path.dirname(pageFile);
  const layoutFile = path.join(dir, 'layout.tsx');
  
  // Don't overwrite the root dashboard layout or (auth) layout
  if (dir === basePath) continue;

  const roles = getAllowedRoles(dir);
  
  // We won't generate a layout if it's broadly accessible and handled by a parent,
  // but generating explicit layouts at every level is safest.
  
  const content = `import { RoleGuard } from '@/components/shared/layout/RoleGuard';

export default function AutoRoleLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={${JSON.stringify(roles)}}>
      {children}
    </RoleGuard>
  );
}
`;

  // We only overwrite or create if it doesn't exist, OR if it's the one we copied earlier.
  // The ones we copied earlier contain 'AdminRouteLayout'.
  let shouldWrite = false;
  if (!fs.existsSync(layoutFile)) {
    shouldWrite = true;
  } else {
    const existingContent = fs.readFileSync(layoutFile, 'utf8');
    if (existingContent.includes('AdminRouteLayout') || existingContent.includes('AutoRoleLayout')) {
      shouldWrite = true;
    }
  }

  if (shouldWrite) {
    fs.writeFileSync(layoutFile, content);
    console.log(`Protected ${dir.replace(basePath, '')} with ${roles.join(',')}`);
    count++;
  }
}

console.log(`Updated ${count} layouts.`);
