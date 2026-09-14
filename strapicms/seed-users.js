const strapi = require('@strapi/strapi');

async function run() {
  const app = await strapi().load();
  
  const roles = await app.db.query('plugin::users-permissions.role').findMany();
  const getRole = (name) => roles.find(r => r.name === name)?.id;

  // Teachers
  const teacherRole = getRole('Teacher');
  const teachers = await app.db.query('api::teacher.teacher').findMany({ populate: ['user'] });
  for (const t of teachers) {
    if (!t.user) {
      console.log('Creating user for teacher:', t.name);
      try {
        const u = await app.plugins['users-permissions'].services.user.add({
          username: t.schoolId,
          email: t.email,
          password: 'Password123!',
          role: teacherRole,
          confirmed: true,
          provider: 'local',
        });
        await app.documents('api::teacher.teacher').update({
          documentId: t.documentId,
          data: { user: u.id },
          status: 'published'
        });
      } catch (e) {
        console.error('Error teacher:', t.name, e.message);
      }
    }
  }

  // Parents
  const parentRole = getRole('Parent');
  const parents = await app.db.query('api::parent.parent').findMany({ populate: ['user'] });
  for (const p of parents) {
    if (!p.user) {
      console.log('Creating user for parent:', p.name);
      try {
        const u = await app.plugins['users-permissions'].services.user.add({
          username: p.schoolId,
          email: p.email,
          password: 'Password123!',
          role: parentRole,
          confirmed: true,
          provider: 'local',
        });
        await app.documents('api::parent.parent').update({
          documentId: p.documentId,
          data: { user: u.id },
          status: 'published'
        });
      } catch (e) {
        console.error('Error parent:', p.name, e.message);
      }
    }
  }

  // Workers
  const workerRole = getRole('Worker');
  const workers = await app.db.query('api::worker.worker').findMany({ populate: ['user'] });
  for (const w of workers) {
    if (!w.user) {
      console.log('Creating user for worker:', w.name);
      try {
        const u = await app.plugins['users-permissions'].services.user.add({
          username: w.schoolId,
          email: w.email,
          password: 'Password123!',
          role: workerRole,
          confirmed: true,
          provider: 'local',
        });
        await app.documents('api::worker.worker').update({
          documentId: w.documentId,
          data: { user: u.id },
          status: 'published'
        });
      } catch (e) {
        console.error('Error worker:', w.name, e.message);
      }
    }
  }

  // Students
  const studentRole = getRole('Student');
  const students = await app.db.query('api::student.student').findMany({ populate: ['user'] });
  for (const s of students) {
    if (!s.user) {
      console.log('Creating user for student:', s.firstName);
      try {
        const u = await app.plugins['users-permissions'].services.user.add({
          username: s.schoolId,
          email: `${s.schoolId}@yahayaschool.edu`.toLowerCase(),
          password: 'Password123!',
          role: studentRole,
          confirmed: true,
          provider: 'local',
        });
        await app.documents('api::student.student').update({
          documentId: s.documentId,
          data: { user: u.id },
          status: 'published'
        });
      } catch (e) {
        console.error('Error student:', s.firstName, e.message);
      }
    }
  }

  console.log('Finished seeding users.');
  process.exit(0);
}
run();
