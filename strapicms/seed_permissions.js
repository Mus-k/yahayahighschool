const Database = require('better-sqlite3');
const crypto = require('crypto');
const path = require('path');

const dbPath = path.join(__dirname, '.tmp', 'data.db');
const db = new Database(dbPath);

const apis = [
  'academic-calendar-event', 'academic-certificate', 'academic-certificate-template',
  'academic-resource', 'academic-term', 'academic-transcript', 'academic-year',
  'admission-application', 'announcement', 'article', 'assessment-category',
  'assessment-type', 'attendance-record', 'audit-log', 'campus', 'category',
  'classroom', 'contact-info', 'contact-submission', 'curriculum', 'dashboard',
  'dawah-activity', 'department', 'donation-campaign', 'download-item', 'event',
  'exam-room', 'exam-schedule', 'exam-session', 'examination', 'faq',
  'finance-accounting-period', 'finance-budget', 'finance-currency', 'finance-exchange-rate',
  'finance-expense', 'finance-hold', 'finance-invoice', 'finance-journal-entry',
  'finance-ledger-entry', 'finance-payroll', 'finance-receipt', 'finance-scholarship',
  'finance-sequence-counter', 'footer-config', 'gallery-item', 'grade-band',
  'grade-moderation', 'gradebook-entry', 'grading-scheme', 'graduation-record',
  'halaqah', 'homepage', 'homework', 'homework-submission', 'honor-roll',
  'language-achievement', 'language-certificate', 'language-competition', 'language-level',
  'language-portfolio', 'language-program', 'lesson-delivery', 'lesson-plan',
  'marks-entry', 'memorization', 'murajaah', 'navigation-menu', 'notification',
  'observation-journal', 'page', 'parent', 'partner', 'placement-test', 'program',
  'promotion-record', 'question', 'question-pool', 'quran-achievement', 'quran-assessment',
  'quran-attendance', 'quran-certificate', 'quran-competition', 'quran-group',
  'quran-program', 'report-card', 'report-template', 'rubric', 'school-id-sequence',
  'school-profile', 'section', 'skill-assessment', 'student', 'student-ranking',
  'student-result', 'subject', 'tajweed-evaluation', 'teacher', 'testimonial',
  'timetable-slot', 'topic', 'worker'
];

const actions = ['find', 'findOne', 'create', 'update', 'delete'];
const now = Date.now();

const insertPerm = db.prepare('INSERT INTO up_permissions (document_id, action, created_at, updated_at, published_at) VALUES (?, ?, ?, ?, ?)');
const insertLink = db.prepare('INSERT INTO up_permissions_role_lnk (permission_id, role_id) VALUES (?, ?)');

let permCount = 0;
for (const api of apis) {
  for (const action of actions) {
    const actionStr = `api::${api}.${api}.${action}`;
    const existing = db.prepare('SELECT id FROM up_permissions WHERE action = ?').get(actionStr);
    let permId;
    if (!existing) {
      const docId = crypto.randomBytes(12).toString('hex');
      const res = insertPerm.run(docId, actionStr, now, now, now);
      permId = res.lastInsertRowid;
      permCount++;
    } else {
      permId = existing.id;
    }
    // Link to Authenticated (role_id 1) and Public (role_id 2)
    for (const roleId of [1, 2]) {
      const linkExist = db.prepare('SELECT * FROM up_permissions_role_lnk WHERE permission_id = ? AND role_id = ?').get(permId, roleId);
      if (!linkExist) {
        insertLink.run(permId, roleId);
      }
    }
  }
}
console.log(`Successfully seeded ${permCount} permissions into Strapi DB!`);
