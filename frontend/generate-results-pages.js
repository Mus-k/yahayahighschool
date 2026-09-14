const fs = NodeJS. require('fs');
const path = NodeJS.require('path');

const baseDir = path.join(__dirname, 'app', '[locale]', '(dashboard)', 'results');
const pages = [
  { dir: 'director-approval', title: "Result Approval Workflow" },
  { dir: 'report-cards', title: "Report Card Generator" },
  { dir: 'transcripts', title: "Transcript Engine" },
  { dir: 'promotions', title: "Promotion Engine" },
  { dir: 'certificates', title: "Certificate Manager" },
  { dir: 'rankings', title: "Rankings & Merit Lists" },
];

pages.forEach(({ dir, title }) => {
  const pageDir = path.join(baseDir, dir);
  fs.mkdirSync(pageDir, { recursive: true });

  const pageCode = `import React from 'react';

export default function ${dir.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}Page() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">${title}</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">
          This dashboard integrates with the Strapi Academic Results & Reporting System (Phase 3D-2).
          Data grids and workflows will be implemented here.
        </p>
      </div>
    </div>
  );
}
`;
  fs.writeFileSync(path.join(pageDir, 'page.tsx'), pageCode);
  console.log(`Created page: ${pageDir}/page.tsx`);
});
