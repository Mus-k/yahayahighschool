const strapi = require('@strapi/strapi').createStrapi();

strapi.start().then(async () => {
  console.log('[Migration] Starting name sync for Course Offerings, Enrollments, and Teacher Assignments...');

  // 1. Migrate Course Offerings names
  const offerings = await strapi.db.query('api::course-offering.course-offering').findMany({
    populate: ['subject', 'academicSection', 'academicYear']
  });
  console.log(`[Migration] Found ${offerings.length} Course Offerings to sync.`);
  for (const off of offerings) {
    const subjectName = off.subject?.name || '';
    const sectionName = off.academicSection?.name || '';
    const yearName = off.academicYear?.name || '';
    const name = `${subjectName} - ${sectionName} (${yearName})`.trim() || `Offering #${off.id}`;
    
    await strapi.db.query('api::course-offering.course-offering').update({
      where: { id: off.id },
      data: { name }
    });
    console.log(`  - Updated Course Offering #${off.id}: "${name}"`);
  }

  // 2. Migrate Student Enrollments names
  const enrollments = await strapi.db.query('api::student-enrollment.student-enrollment').findMany({
    populate: ['student', 'courseOffering', 'courseOffering.subject']
  });
  console.log(`[Migration] Found ${enrollments.length} Student Enrollments to sync.`);
  for (const enr of enrollments) {
    const student = enr.student;
    const studentName = student ? (student.firstName ? `${student.firstName} ${student.lastName}` : student.schoolId || '') : '';
    const courseName = enr.courseOffering?.name || enr.courseOffering?.subject?.name || '';
    const name = `${studentName} - ${courseName}`.trim() || `Enrollment #${enr.id}`;

    await strapi.db.query('api::student-enrollment.student-enrollment').update({
      where: { id: enr.id },
      data: { name }
    });
    console.log(`  - Updated Student Enrollment #${enr.id}: "${name}"`);
  }

  // 3. Migrate Teacher Assignments names
  const assignments = await strapi.db.query('api::teacher-assignment.teacher-assignment').findMany({
    populate: ['teacher', 'courseOffering', 'courseOffering.subject']
  });
  console.log(`[Migration] Found ${assignments.length} Teacher Assignments to sync.`);
  for (const asn of assignments) {
    const teacher = asn.teacher;
    const teacherName = teacher ? (teacher.displayName || teacher.name || (teacher.firstName ? `${teacher.firstName} ${teacher.lastName}` : teacher.schoolId || '')) : '';
    const courseName = asn.courseOffering?.name || asn.courseOffering?.subject?.name || '';
    const name = `${teacherName} - ${courseName}`.trim() || `Assignment #${asn.id}`;

    await strapi.db.query('api::teacher-assignment.teacher-assignment').update({
      where: { id: asn.id },
      data: { name }
    });
    console.log(`  - Updated Teacher Assignment #${asn.id}: "${name}"`);
  }

  console.log('[Migration] All names synced successfully!');
  process.exit(0);
}).catch(err => {
  console.error('[Migration] Failed to run migration:', err);
  process.exit(1);
});
