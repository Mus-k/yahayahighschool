const fs = NodeJS. require('fs');
const path = NodeJS.require('path');

const basePath = 'C:\\Users\\pc\\YAHAYASCHOOL\\frontend\\app\\[locale]\\(dashboard)';
const adminPath = path.join(basePath, 'admin');
const teacherPath = path.join(basePath, 'teacher');
const studentPath = path.join(basePath, 'student');
const directorPath = path.join(basePath, 'director');

// Create literal folders
[adminPath, teacherPath, studentPath, directorPath].forEach(p => {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

// Admin folders
const adminFolders = ['academic-structure', 'directory', 'erp', 'parents', 'students', 'teachers', 'workers'];
for (const folder of adminFolders) {
  try {
    const src = path.join(basePath, folder);
    if (fs.existsSync(src)) {
      fs.renameSync(src, path.join(adminPath, folder));
      console.log(`Moved ${folder} to admin/`);
    }
  } catch(e) {
    console.log(`Failed to move ${folder}: ${e.message}`);
  }
}

// Assessment
try {
  if (fs.existsSync(path.join(basePath, 'assessment', 'teacher'))) {
    fs.mkdirSync(path.join(teacherPath, 'assessment'), { recursive: true });
    fs.renameSync(path.join(basePath, 'assessment', 'teacher'), path.join(teacherPath, 'assessment'));
    console.log('Moved assessment/teacher to teacher/assessment');
  }
} catch(e){}

try {
  if (fs.existsSync(path.join(basePath, 'assessment', 'director'))) {
    fs.mkdirSync(path.join(directorPath, 'assessment'), { recursive: true });
    fs.renameSync(path.join(basePath, 'assessment', 'director'), path.join(directorPath, 'assessment'));
    console.log('Moved assessment/director to director/assessment');
  }
} catch(e){}

try {
  if (fs.existsSync(path.join(basePath, 'assessment', 'grading-schemes'))) {
    fs.mkdirSync(path.join(adminPath, 'assessment'), { recursive: true });
    fs.renameSync(path.join(basePath, 'assessment', 'grading-schemes'), path.join(adminPath, 'assessment', 'grading-schemes'));
    fs.renameSync(path.join(basePath, 'assessment', 'exams'), path.join(adminPath, 'assessment', 'exams'));
    fs.renameSync(path.join(basePath, 'assessment', 'question-bank'), path.join(adminPath, 'assessment', 'question-bank'));
    fs.renameSync(path.join(basePath, 'assessment', 'scheduling'), path.join(adminPath, 'assessment', 'scheduling'));
    fs.renameSync(path.join(basePath, 'assessment', 'marks-entry'), path.join(adminPath, 'assessment', 'marks-entry'));
    console.log('Moved rest of assessment to admin/assessment');
  }
} catch(e){}

// LMS
try {
  if (fs.existsSync(path.join(basePath, 'lms', 'teacher'))) {
    fs.mkdirSync(path.join(teacherPath, 'lms'), { recursive: true });
    fs.renameSync(path.join(basePath, 'lms', 'teacher'), path.join(teacherPath, 'lms'));
  }
} catch(e){}

try {
  if (fs.existsSync(path.join(basePath, 'lms', 'student'))) {
    fs.mkdirSync(path.join(studentPath, 'lms'), { recursive: true });
    fs.renameSync(path.join(basePath, 'lms', 'student'), path.join(studentPath, 'lms'));
  }
} catch(e){}

try {
  if (fs.existsSync(path.join(basePath, 'lms', 'director'))) {
    fs.mkdirSync(path.join(directorPath, 'lms'), { recursive: true });
    fs.renameSync(path.join(basePath, 'lms', 'director'), path.join(directorPath, 'lms'));
  }
} catch(e){}

// Results
try {
  if (fs.existsSync(path.join(basePath, 'results'))) {
    fs.renameSync(path.join(basePath, 'results'), path.join(studentPath, 'results'));
    console.log('Moved results to student/results');
  }
} catch(e){}
