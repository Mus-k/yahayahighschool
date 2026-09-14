const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function seed() {
  const client = new Client({ user: 'postgres', host: 'localhost', database: 'yahaya_scool', password: 'postgres18', port: 5432 });
  await client.connect();

  const hashedPw = await bcrypt.hash('Password123!', 10);

  // Get roles
  const resRoles = await client.query('SELECT id, name FROM up_roles');
  const roles = {};
  for (let r of resRoles.rows) roles[r.name] = r.id;

  // Insert helper
  async function createUser(email, username, roleId) {
    const res = await client.query(
      `INSERT INTO up_users (username, email, provider, password, confirmed, blocked, created_at, updated_at) 
       VALUES ($1, $2, 'local', $3, true, false, NOW(), NOW()) RETURNING id`,
      [username, email, hashedPw]
    );
    const userId = res.rows[0].id;
    // create up_users_role_lnk
    await client.query(
      `INSERT INTO up_users_role_lnk (user_id, role_id) VALUES ($1, $2)`,
      [userId, roleId]
    );
    return userId;
  }

  // Teacher
  const teachers = await client.query('SELECT id, document_id, email, school_id FROM teachers WHERE id NOT IN (SELECT teacher_id FROM teachers_user_lnk)');
  for (let t of teachers.rows) {
    console.log('Seeding teacher', t.school_id);
    const uid = await createUser(t.email, t.school_id, roles['Teacher']);
    await client.query(`INSERT INTO teachers_user_lnk (teacher_id, user_id) VALUES ($1, $2)`, [t.id, uid]);
  }

  // Parent
  const parents = await client.query('SELECT id, document_id, email, school_id FROM parents WHERE id NOT IN (SELECT parent_id FROM parents_user_lnk)');
  for (let p of parents.rows) {
    console.log('Seeding parent', p.school_id);
    const uid = await createUser(p.email, p.school_id, roles['Parent']);
    await client.query(`INSERT INTO parents_user_lnk (parent_id, user_id) VALUES ($1, $2)`, [p.id, uid]);
  }

  // Worker
  const workers = await client.query('SELECT id, document_id, email, school_id FROM workers WHERE id NOT IN (SELECT worker_id FROM workers_user_lnk)');
  for (let w of workers.rows) {
    console.log('Seeding worker', w.school_id);
    const uid = await createUser(w.email, w.school_id, roles['Worker']);
    await client.query(`INSERT INTO workers_user_lnk (worker_id, user_id) VALUES ($1, $2)`, [w.id, uid]);
  }

  // Student
  const students = await client.query('SELECT id, document_id, school_id FROM students WHERE id NOT IN (SELECT student_id FROM students_user_lnk)');
  for (let s of students.rows) {
    console.log('Seeding student', s.school_id);
    const email = (s.school_id + '@yahayaschool.edu').toLowerCase();
    const uid = await createUser(email, s.school_id, roles['Student']);
    await client.query(`INSERT INTO students_user_lnk (student_id, user_id) VALUES ($1, $2)`, [s.id, uid]);
  }

  console.log('Done!');
  await client.end();
}
seed().catch(e => console.error(e));
