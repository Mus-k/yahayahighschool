const { createStrapi } = require('@strapi/strapi');

async function main() {
  const app = await createStrapi().load();
  
  try {
    console.log("Starting legacy data migration...");
    
    // Find all legacy sections
    const sections = await app.db.query('api::section.section').findMany({
      populate: ['students', 'teachers', 'academicYear']
    });
    
    console.log(`Found ${sections.length} legacy sections.`);
    
    // Default Curriculum
    let defaultCurriculum = await app.db.query('api::curriculum.curriculum').findOne({});
    if (!defaultCurriculum) {
      defaultCurriculum = await app.db.query('api::curriculum.curriculum').create({
        data: {
          title: "Standard Academic Curriculum",
          version: "1.0",
          recordStatus: "Active",
          publishedAt: new Date()
        }
      });
      console.log("Created default Curriculum:", defaultCurriculum.title);
    }
    
    // Define some Academic Sections (e.g. English, Arabic, Quran, General Sciences)
    const academicDivisions = [
      { name: "Arabic Section", code: "ARABIC", color: "#e11d48", icon: "languages" },
      { name: "English Section", code: "ENGLISH", color: "#2563eb", icon: "book" },
      { name: "Qur'an Memorization Section", code: "QURAN", color: "#16a34a", icon: "award" },
      { name: "General Sciences Section", code: "SCIENCES", color: "#d97706", icon: "atom" }
    ];
    
    const dbAcademicSections = [];
    for (const div of academicDivisions) {
      let existing = await app.db.query('api::section.section').findOne({
        where: { code: div.code }
      });
      if (!existing) {
        existing = await app.db.query('api::section.section').create({
          data: {
            name: div.name,
            code: div.code,
            color: div.color,
            icon: div.icon,
            active: true,
            publishedAt: new Date()
          }
        });
        console.log(`Created Academic Section: ${div.name}`);
      } else {
        console.log(`Academic Section already exists: ${div.name}`);
      }
      dbAcademicSections.push(existing);
    }
    
    const defaultAcademicSection = dbAcademicSections.find(s => s.code === 'ENGLISH') || dbAcademicSections[0];
    
    for (const sec of sections) {
      // Skip Academic Sections that we just created
      if (['ARABIC', 'ENGLISH', 'QURAN', 'SCIENCES'].includes(sec.code)) {
        continue;
      }
      
      console.log(`Migrating legacy Section: ${sec.name} (Code: ${sec.code})...`);
      
      // Determine Grade Level from name (e.g. "Grade 10-A" -> "Grade 10")
      let gradeName = sec.name;
      if (gradeName.includes('-')) {
        gradeName = gradeName.split('-')[0].trim();
      }
      
      // Look up or create Grade Level
      let gradeLevel = await app.db.query('api::grade-level.grade-level').findOne({
        where: { name: gradeName }
      });
      if (!gradeLevel) {
        gradeLevel = await app.db.query('api::grade-level.grade-level').create({
          data: {
            name: gradeName,
            code: gradeName.toUpperCase().replace(/\s+/g, ''),
            order: 10,
            capacity: sec.capacity || 35,
            curriculum: defaultCurriculum.id,
            publishedAt: new Date()
          }
        });
        console.log(`Created Grade Level: ${gradeName}`);
      }
      
      // Create Homeroom for this cohort (e.g. "Grade 10-A Homeroom")
      const hrName = `${sec.name} Homeroom`;
      let homeroom = await app.db.query('api::homeroom.homeroom').findOne({
        where: { name: hrName }
      });
      if (!homeroom) {
        const studentIds = (sec.students || []).map(s => s.id);
        const advisorId = sec.teachers?.[0]?.id || null;
        
        homeroom = await app.db.query('api::homeroom.homeroom').create({
          data: {
            name: hrName,
            code: `${sec.code}_HR`,
            gradeLevel: gradeLevel.id,
            advisor: advisorId,
            students: studentIds,
            publishedAt: new Date()
          }
        });
        console.log(`Created Homeroom: ${hrName} with ${studentIds.length} students`);
      }
      
      // Find or create default Subjects to map class offerings
      const subjects = await app.db.query('api::subject.subject').findMany({});
      if (subjects.length === 0) {
        console.warn("No subjects found to map Course Offerings.");
        continue;
      }
      
      const defaultSubject = subjects[0];
      const defaultTeacher = sec.teachers?.[0] || null;
      
      // Create a Course Offering instance for this grade level + default subject
      const coName = `${sec.name} - ${defaultSubject.name || 'General studies'}`;
      let offering = await app.db.query('api::course-offering.course-offering').findOne({
        where: {
          gradeLevel: gradeLevel.id,
          subject: defaultSubject.id,
          academicSection: defaultAcademicSection.id
        }
      });
      if (!offering) {
        offering = await app.db.query('api::course-offering.course-offering').create({
          data: {
            academicSection: defaultAcademicSection.id,
            gradeLevel: gradeLevel.id,
            subject: defaultSubject.id,
            teacher: defaultTeacher ? defaultTeacher.id : null,
            academicYear: sec.academicYear ? sec.academicYear.id : null,
            capacity: sec.capacity || 35,
            deliveryMode: "in-person",
            status: "active",
            publishedAt: new Date()
          }
        });
        console.log(`Created Course Offering: ${coName}`);
        
        // Enroll students into this offering
        for (const stud of (sec.students || [])) {
          await app.db.query('api::student-enrollment.student-enrollment').create({
            data: {
              student: stud.id,
              courseOffering: offering.id,
              enrollmentDate: new Date(),
              enrollmentStatus: "active",
              gradeStatus: "pending",
              publishedAt: new Date()
            }
          });
        }
        console.log(`Enrolled ${(sec.students || []).length} students into Course Offering.`);
        
        // Assign teacher to this offering
        if (defaultTeacher) {
          await app.db.query('api::teacher-assignment.teacher-assignment').create({
            data: {
              teacher: defaultTeacher.id,
              courseOffering: offering.id,
              workload: 3.0,
              publishedAt: new Date()
            }
          });
          console.log(`Assigned teacher ${defaultTeacher.firstName} to Course Offering.`);
        }
      }
    }
    
    console.log("Migration completed successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await app.destroy();
    process.exit(0);
  }
}

main();
