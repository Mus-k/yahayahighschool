const { Client } = require('pg');
const crypto = require('crypto');

const client = new Client({
  host: '127.0.0.1',
  port: 5432,
  database: 'yahaya_scool',
  user: 'postgres',
  password: 'postgres18'
});

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

client.connect().then(async () => {
  console.log('Connected to PostgreSQL database yahaya_scool.');
  
  const rolesRes = await client.query('SELECT id, type FROM up_roles');
  const roleIds = rolesRes.rows.map(r => r.id);

  let insertedCount = 0;
  let linkedCount = 0;

  for (const api of apis) {
    for (const action of actions) {
      const actionStr = `api::${api}.${api}.${action}`;
      
      let permRes = await client.query('SELECT id FROM up_permissions WHERE action = $1', [actionStr]);
      let permId;

      if (permRes.rows.length === 0) {
        const docId = crypto.randomBytes(12).toString('hex');
        const now = new Date();
        const insertRes = await client.query(
          'INSERT INTO up_permissions (document_id, action, created_at, updated_at, published_at) VALUES ($1, $2, $3, $4, $5) RETURNING id',
          [docId, actionStr, now, now, now]
        );
        permId = insertRes.rows[0].id;
        insertedCount++;
      } else {
        permId = permRes.rows[0].id;
      }

      for (const roleId of roleIds) {
        const linkRes = await client.query(
          'SELECT * FROM up_permissions_role_lnk WHERE permission_id = $1 AND role_id = $2',
          [permId, roleId]
        );
        if (linkRes.rows.length === 0) {
          await client.query(
            'INSERT INTO up_permissions_role_lnk (permission_id, role_id) VALUES ($1, $2)',
            [permId, roleId]
          );
          linkedCount++;
        }
      }
    }
  }

  console.log(`✅ PostgreSQL Seeding Complete! Inserted ${insertedCount} permissions, created ${linkedCount} role links.`);
  client.end();
}).catch(err => {
  console.error('PG Error:', err);
  process.exit(1);
});
