const fs = NodeJS.require('fs');
const path = NodeJS.require('path');

const baseDir = path.join(__dirname, 'app', '[locale]', '(dashboard)', 'qms');
const pages = [
  { dir: 'teacher', title: "QMS Teacher Dashboard" },
  { dir: 'director', title: "QMS Director Analytics" },
  { dir: 'programs', title: "Qur'an Programs & Groups" },
  { dir: 'memorization', title: "Hifz Tracking & Records" },
  { dir: 'revision', title: "Muraja'ah Engine" },
  { dir: 'tajweed', title: "Tajweed Evaluations" },
  { dir: 'halaqah', title: "Daily Halaqah Groups" },
  { dir: 'attendance', title: "Qur'an Attendance Registry" },
  { dir: 'dawah', title: "Da'wah Activities" },
  { dir: 'achievements', title: "Competitions & Certificates" },
];

fs.mkdirSync(baseDir, { recursive: true });

pages.forEach(page => {
  const pageDir = path.join(baseDir, page.dir);
  fs.mkdirSync(pageDir, { recursive: true });

  const content = `export default function ${page.title.replace(/[^a-zA-Z]/g, '')}Page() {
  return (
    <div className="flex flex-col h-full items-center justify-center space-y-4 p-8">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">${page.title}</h1>
      <p className="text-slate-500 dark:text-slate-400 text-center max-w-lg">
        This is a placeholder page for the Phase 3B QMS module: <strong>${page.title}</strong>.
        The full interface will be built out iteratively.
      </p>
    </div>
  );
}
`;
  fs.writeFileSync(path.join(pageDir, 'page.tsx'), content);
});

console.log('QMS placeholder pages generated successfully!');
