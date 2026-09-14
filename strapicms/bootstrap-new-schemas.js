const fs = require('fs');
const path = require('path');

const API_DIR = path.join(__dirname, 'src', 'api');

// Helper to make folders
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Helper to write files safely
function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, typeof content === 'object' ? JSON.stringify(content, null, 2) : content, 'utf8');
  console.log(`Created: ${path.relative(__dirname, filePath)}`);
}

// 1. GRADE-LEVEL MODEL
const gradeLevelDir = path.join(API_DIR, 'grade-level');
writeFile(path.join(gradeLevelDir, 'content-types', 'grade-level', 'schema.json'), {
  kind: "collectionType",
  collectionName: "grade_levels",
  info: {
    singularName: "grade-level",
    pluralName: "grade-levels",
    displayName: "Grade Level",
    description: "Independent Grade Level entity"
  },
  options: { draftAndPublish: false },
  attributes: {
    name: { type: "string", required: true },
    code: { type: "string", required: true },
    order: { type: "integer", default: 1 },
    capacity: { type: "integer", default: 35 },
    curriculum: {
      type: "relation",
      relation: "manyToOne",
      target: "api::curriculum.curriculum",
      inversedBy: "gradeLevels"
    },
    courseOfferings: {
      type: "relation",
      relation: "oneToMany",
      target: "api::course-offering.course-offering",
      mappedBy: "gradeLevel"
    },
    homerooms: {
      type: "relation",
      relation: "oneToMany",
      target: "api::homeroom.homeroom",
      mappedBy: "gradeLevel"
    }
  }
});
writeFile(path.join(gradeLevelDir, 'controllers', 'grade-level.ts'), `import { factories } from '@strapi/strapi';\nexport default factories.createCoreController('api::grade-level.grade-level' as any);\n`);
writeFile(path.join(gradeLevelDir, 'routes', 'grade-level.ts'), `import { factories } from '@strapi/strapi';\nexport default factories.createCoreRouter('api::grade-level.grade-level' as any);\n`);
writeFile(path.join(gradeLevelDir, 'services', 'grade-level.ts'), `import { factories } from '@strapi/strapi';\nexport default factories.createCoreService('api::grade-level.grade-level' as any);\n`);

// 2. COURSE-OFFERING MODEL
const courseOfferingDir = path.join(API_DIR, 'course-offering');
writeFile(path.join(courseOfferingDir, 'content-types', 'course-offering', 'schema.json'), {
  kind: "collectionType",
  collectionName: "course_offerings",
  info: {
    singularName: "course-offering",
    pluralName: "course-offerings",
    displayName: "Course Offering",
    description: "Specific scheduled course instance"
  },
  options: { draftAndPublish: false },
  attributes: {
    academicSection: {
      type: "relation",
      relation: "manyToOne",
      target: "api::section.section",
      inversedBy: "courseOfferings"
    },
    gradeLevel: {
      type: "relation",
      relation: "manyToOne",
      target: "api::grade-level.grade-level",
      inversedBy: "courseOfferings"
    },
    subject: {
      type: "relation",
      relation: "manyToOne",
      target: "api::subject.subject",
      inversedBy: "courseOfferings"
    },
    teacher: {
      type: "relation",
      relation: "manyToOne",
      target: "api::teacher.teacher",
      inversedBy: "courseOfferings"
    },
    room: {
      type: "relation",
      relation: "manyToOne",
      target: "api::classroom.classroom"
    },
    academicYear: {
      type: "relation",
      relation: "manyToOne",
      target: "api::academic-year.academic-year"
    },
    academicTerm: {
      type: "relation",
      relation: "manyToOne",
      target: "api::academic-term.academic-term"
    },
    capacity: { type: "integer", default: 35 },
    schedule: { type: "json" },
    deliveryMode: {
      type: "enumeration",
      enum: ["in-person", "online", "hybrid"],
      default: "in-person"
    },
    status: {
      type: "enumeration",
      enum: ["active", "cancelled", "completed"],
      default: "active"
    },
    studentEnrollments: {
      type: "relation",
      relation: "oneToMany",
      target: "api::student-enrollment.student-enrollment",
      mappedBy: "courseOffering"
    },
    teacherAssignments: {
      type: "relation",
      relation: "oneToMany",
      target: "api::teacher-assignment.teacher-assignment",
      mappedBy: "courseOffering"
    }
  }
});
writeFile(path.join(courseOfferingDir, 'controllers', 'course-offering.ts'), `import { factories } from '@strapi/strapi';\nexport default factories.createCoreController('api::course-offering.course-offering' as any);\n`);
writeFile(path.join(courseOfferingDir, 'routes', 'course-offering.ts'), `import { factories } from '@strapi/strapi';\nexport default factories.createCoreRouter('api::course-offering.course-offering' as any);\n`);
writeFile(path.join(courseOfferingDir, 'services', 'course-offering.ts'), `import { factories } from '@strapi/strapi';\nexport default factories.createCoreService('api::course-offering.course-offering' as any);\n`);

// 3. STUDENT-ENROLLMENT MODEL
const studentEnrollmentDir = path.join(API_DIR, 'student-enrollment');
writeFile(path.join(studentEnrollmentDir, 'content-types', 'student-enrollment', 'schema.json'), {
  kind: "collectionType",
  collectionName: "student_enrollments",
  info: {
    singularName: "student-enrollment",
    pluralName: "student-enrollments",
    displayName: "Student Enrollment",
    description: "Enrollment mapping a student to a Course Offering"
  },
  options: { draftAndPublish: false },
  attributes: {
    student: {
      type: "relation",
      relation: "manyToOne",
      target: "api::student.student",
      inversedBy: "enrollments"
    },
    courseOffering: {
      type: "relation",
      relation: "manyToOne",
      target: "api::course-offering.course-offering",
      inversedBy: "studentEnrollments"
    },
    enrollmentDate: { type: "date" },
    enrollmentStatus: {
      type: "enumeration",
      enum: ["active", "dropped", "completed"],
      default: "active"
    },
    gradeStatus: {
      type: "enumeration",
      enum: ["graded", "pending"],
      default: "pending"
    }
  }
});
writeFile(path.join(studentEnrollmentDir, 'controllers', 'student-enrollment.ts'), `import { factories } from '@strapi/strapi';\nexport default factories.createCoreController('api::student-enrollment.student-enrollment' as any);\n`);
writeFile(path.join(studentEnrollmentDir, 'routes', 'student-enrollment.ts'), `import { factories } from '@strapi/strapi';\nexport default factories.createCoreRouter('api::student-enrollment.student-enrollment' as any);\n`);
writeFile(path.join(studentEnrollmentDir, 'services', 'student-enrollment.ts'), `import { factories } from '@strapi/strapi';\nexport default factories.createCoreService('api::student-enrollment.student-enrollment' as any);\n`);

// 4. TEACHER-ASSIGNMENT MODEL
const teacherAssignmentDir = path.join(API_DIR, 'teacher-assignment');
writeFile(path.join(teacherAssignmentDir, 'content-types', 'teacher-assignment', 'schema.json'), {
  kind: "collectionType",
  collectionName: "teacher_assignments",
  info: {
    singularName: "teacher-assignment",
    pluralName: "teacher-assignments",
    displayName: "Teacher Assignment",
    description: "Teacher workloads per Course Offering"
  },
  options: { draftAndPublish: false },
  attributes: {
    teacher: {
      type: "relation",
      relation: "manyToOne",
      target: "api::teacher.teacher",
      inversedBy: "assignments"
    },
    courseOffering: {
      type: "relation",
      relation: "manyToOne",
      target: "api::course-offering.course-offering",
      inversedBy: "teacherAssignments"
    },
    workload: { type: "decimal" }
  }
});
writeFile(path.join(teacherAssignmentDir, 'controllers', 'teacher-assignment.ts'), `import { factories } from '@strapi/strapi';\nexport default factories.createCoreController('api::teacher-assignment.teacher-assignment' as any);\n`);
writeFile(path.join(teacherAssignmentDir, 'routes', 'teacher-assignment.ts'), `import { factories } from '@strapi/strapi';\nexport default factories.createCoreRouter('api::teacher-assignment.teacher-assignment' as any);\n`);
writeFile(path.join(teacherAssignmentDir, 'services', 'teacher-assignment.ts'), `import { factories } from '@strapi/strapi';\nexport default factories.createCoreService('api::teacher-assignment.teacher-assignment' as any);\n`);

// 5. HOMEROOM MODEL
const homeroomDir = path.join(API_DIR, 'homeroom');
writeFile(path.join(homeroomDir, 'content-types', 'homeroom', 'schema.json'), {
  kind: "collectionType",
  collectionName: "homerooms",
  info: {
    singularName: "homeroom",
    pluralName: "homerooms",
    displayName: "Homeroom",
    description: "Administrative cohort group"
  },
  options: { draftAndPublish: false },
  attributes: {
    name: { type: "string", required: true },
    code: { type: "string", required: true },
    gradeLevel: {
      type: "relation",
      relation: "manyToOne",
      target: "api::grade-level.grade-level",
      inversedBy: "homerooms"
    },
    advisor: {
      type: "relation",
      relation: "manyToOne",
      target: "api::teacher.teacher"
    },
    classroom: {
      type: "relation",
      relation: "manyToOne",
      target: "api::classroom.classroom"
    },
    students: {
      type: "relation",
      relation: "manyToMany",
      target: "api::student.student"
    }
  }
});
writeFile(path.join(homeroomDir, 'controllers', 'homeroom.ts'), `import { factories } from '@strapi/strapi';\nexport default factories.createCoreController('api::homeroom.homeroom' as any);\n`);
writeFile(path.join(homeroomDir, 'routes', 'homeroom.ts'), `import { factories } from '@strapi/strapi';\nexport default factories.createCoreRouter('api::homeroom.homeroom' as any);\n`);
writeFile(path.join(homeroomDir, 'services', 'homeroom.ts'), `import { factories } from '@strapi/strapi';\nexport default factories.createCoreService('api::homeroom.homeroom' as any);\n`);

// ─────────────────────────────────────────────────────────────────────────────
// MODIFY EXISTING SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

// A. Section (Academic Section)
const sectionSchemaPath = path.join(API_DIR, 'section', 'content-types', 'section', 'schema.json');
if (fs.existsSync(sectionSchemaPath)) {
  const sectionSchema = JSON.parse(fs.readFileSync(sectionSchemaPath, 'utf8'));
  sectionSchema.attributes = {
    ...sectionSchema.attributes,
    courseOfferings: {
      type: "relation",
      relation: "oneToMany",
      target: "api::course-offering.course-offering",
      mappedBy: "academicSection"
    },
    academicHead: {
      type: "relation",
      relation: "manyToOne",
      target: "api::teacher.teacher"
    },
    color: { type: "string" },
    icon: { type: "string" }
  };
  writeFile(sectionSchemaPath, sectionSchema);
}

// B. Subject
const subjectSchemaPath = path.join(API_DIR, 'subject', 'content-types', 'subject', 'schema.json');
if (fs.existsSync(subjectSchemaPath)) {
  const subjectSchema = JSON.parse(fs.readFileSync(subjectSchemaPath, 'utf8'));
  subjectSchema.attributes = {
    ...subjectSchema.attributes,
    academicSection: {
      type: "relation",
      relation: "manyToOne",
      target: "api::section.section"
    },
    gradeLevels: {
      type: "relation",
      relation: "manyToMany",
      target: "api::grade-level.grade-level"
    },
    courseOfferings: {
      type: "relation",
      relation: "oneToMany",
      target: "api::course-offering.course-offering",
      mappedBy: "subject"
    }
  };
  writeFile(subjectSchemaPath, subjectSchema);
}

// C. Student
const studentSchemaPath = path.join(API_DIR, 'student', 'content-types', 'student', 'schema.json');
if (fs.existsSync(studentSchemaPath)) {
  const studentSchema = JSON.parse(fs.readFileSync(studentSchemaPath, 'utf8'));
  studentSchema.attributes = {
    ...studentSchema.attributes,
    enrollments: {
      type: "relation",
      relation: "oneToMany",
      target: "api::student-enrollment.student-enrollment",
      mappedBy: "student"
    }
  };
  writeFile(studentSchemaPath, studentSchema);
}

// D. Teacher
const teacherSchemaPath = path.join(API_DIR, 'teacher', 'content-types', 'teacher', 'schema.json');
if (fs.existsSync(teacherSchemaPath)) {
  const teacherSchema = JSON.parse(fs.readFileSync(teacherSchemaPath, 'utf8'));
  teacherSchema.attributes = {
    ...teacherSchema.attributes,
    assignments: {
      type: "relation",
      relation: "oneToMany",
      target: "api::teacher-assignment.teacher-assignment",
      mappedBy: "teacher"
    },
    courseOfferings: {
      type: "relation",
      relation: "oneToMany",
      target: "api::course-offering.course-offering",
      mappedBy: "teacher"
    }
  };
  writeFile(teacherSchemaPath, teacherSchema);
}

// E. Curriculum
const curriculumSchemaPath = path.join(API_DIR, 'curriculum', 'content-types', 'curriculum', 'schema.json');
if (fs.existsSync(curriculumSchemaPath)) {
  const curriculumSchema = JSON.parse(fs.readFileSync(curriculumSchemaPath, 'utf8'));
  curriculumSchema.attributes = {
    ...curriculumSchema.attributes,
    gradeLevels: {
      type: "relation",
      relation: "oneToMany",
      target: "api::grade-level.grade-level",
      mappedBy: "curriculum"
    }
  };
  writeFile(curriculumSchemaPath, curriculumSchema);
}

console.log("SUCCESS: All new schemas, controllers, routes, and services bootstrapped successfully!");
