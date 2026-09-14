const fs = NodeJS.require('fs');
const path = NodeJS.require('path');

const baseDir = path.join(__dirname, 'app', '[locale]', '(dashboard)', 'assessment');
const pages = [
  { dir: 'teacher', title: "Assessment Teacher Dashboard" },
  { dir: 'director', title: "Assessment Director Analytics" },
  { dir: 'grading-schemes', title: "Grading Systems & Templates (Liberia 6-Period)" },
  { dir: 'exams', title: "Examination Builder & Sessions" },
  { dir: 'question-bank', title: "Question Bank & Pools" },
  { dir: 'scheduling', title: "Exam Scheduling Calendar" },
  { dir: 'marks-entry', title: "Marks Entry Data Grid" },
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
        This is a placeholder page for the Phase 3D-1 Assessment module: <strong>${page.title}</strong>.
        The full interface will be built out iteratively.
      </p>
    </div>
  );
}
`;
  fs.writeFileSync(path.join(pageDir, 'page.tsx'), content);
});

console.log('Assessment placeholder pages generated successfully!');
