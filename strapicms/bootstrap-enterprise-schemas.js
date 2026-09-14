const fs = require('fs');
const path = require('path');

const apiPath = path.join(__dirname, 'src/api');

function createModel(name, schema) {
  const dir = path.join(apiPath, name, 'content-types', name);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'schema.json'), JSON.stringify(schema, null, 2));
  console.log(`Created: src\\api\\${name}\\content-types\\${name}\\schema.json`);

  const controllerDir = path.join(apiPath, name, 'controllers');
  fs.mkdirSync(controllerDir, { recursive: true });
  fs.writeFileSync(
    path.join(controllerDir, `${name}.ts`),
    `import { factories } from '@strapi/strapi';\n\nexport default factories.createCoreController('api::${name}.${name}' as any);\n`
  );
  console.log(`Created: src\\api\\${name}\\controllers\\${name}.ts`);

  const routeDir = path.join(apiPath, name, 'routes');
  fs.mkdirSync(routeDir, { recursive: true });
  fs.writeFileSync(
    path.join(routeDir, `${name}.ts`),
    `import { factories } from '@strapi/strapi';\n\nexport default factories.createCoreRouter('api::${name}.${name}' as any);\n`
  );
  console.log(`Created: src\\api\\${name}\\routes\\${name}.ts`);

  const serviceDir = path.join(apiPath, name, 'services');
  fs.mkdirSync(serviceDir, { recursive: true });
  fs.writeFileSync(
    path.join(serviceDir, `${name}.ts`),
    `import { factories } from '@strapi/strapi';\n\nexport default factories.createCoreService('api::${name}.${name}' as any);\n`
  );
  console.log(`Created: src\\api\\${name}\\services\\${name}.ts`);
}

// 1. grading-policy
createModel('grading-policy', {
  kind: 'collectionType',
  collectionName: 'grading_policies',
  info: { singularName: 'grading-policy', pluralName: 'grading-policies', displayName: 'Grading Policy' },
  options: { draftAndPublish: false },
  attributes: {
    gradeName: { type: 'string', required: true },
    minScore: { type: 'decimal', required: true },
    maxScore: { type: 'decimal', required: true },
    gpaPoints: { type: 'decimal', required: true },
    isPassing: { type: 'boolean', default: true },
    isDistinction: { type: 'boolean', default: false },
    remedialThreshold: { type: 'decimal', default: 50.0 }
  }
});

// 2. assessment-blueprint
createModel('assessment-blueprint', {
  kind: 'collectionType',
  collectionName: 'assessment_blueprints',
  info: { singularName: 'assessment-blueprint', pluralName: 'assessment-blueprints', displayName: 'Assessment Blueprint' },
  options: { draftAndPublish: false },
  attributes: {
    componentName: { type: 'enumeration', enum: ['Homework', 'Quiz', 'Project', 'Participation', 'Attendance', 'Exam', 'Oral', 'Practical'], required: true },
    weightPercentage: { type: 'decimal', required: true },
    subject: { type: 'relation', relation: 'manyToOne', target: 'api::subject.subject' }
  }
});

// 3. teaching-progress
createModel('teaching-progress', {
  kind: 'collectionType',
  collectionName: 'teaching_progresses',
  info: { singularName: 'teaching-progress', pluralName: 'teaching-progresses', displayName: 'Teaching Progress' },
  options: { draftAndPublish: false },
  attributes: {
    weekNumber: { type: 'integer', required: true },
    lessonDelivered: { type: 'boolean', default: false },
    attendanceSubmitted: { type: 'boolean', default: false },
    homeworkGiven: { type: 'boolean', default: false },
    outcomeCompleted: { type: 'boolean', default: false },
    materialsUploaded: { type: 'boolean', default: false },
    notes: { type: 'text' },
    courseOffering: { type: 'relation', relation: 'manyToOne', target: 'api::course-offering.course-offering' }
  }
});

// 4. grade-approval
createModel('grade-approval', {
  kind: 'collectionType',
  collectionName: 'grade_approvals',
  info: { singularName: 'grade-approval', pluralName: 'grade-approvals', displayName: 'Grade Approval' },
  options: { draftAndPublish: false },
  attributes: {
    status: { type: 'enumeration', enum: ['Draft', 'Submitted', 'Approved', 'Locked', 'Released'], default: 'Draft' },
    submittedAt: { type: 'datetime' },
    releasedAt: { type: 'datetime' },
    courseOffering: { type: 'relation', relation: 'manyToOne', target: 'api::course-offering.course-offering' },
    academicTerm: { type: 'relation', relation: 'manyToOne', target: 'api::academic-term.academic-term' },
    approvedBy: { type: 'relation', relation: 'manyToOne', target: 'plugin::users-permissions.user' }
  }
});

// 5. academic-appeal
createModel('academic-appeal', {
  kind: 'collectionType',
  collectionName: 'academic_appeals',
  info: { singularName: 'academic-appeal', pluralName: 'academic-appeals', displayName: 'Academic Appeal' },
  options: { draftAndPublish: false },
  attributes: {
    originalGrade: { type: 'decimal', required: true },
    requestedGrade: { type: 'decimal' },
    reason: { type: 'text', required: true },
    status: { type: 'enumeration', enum: ['Pending', 'UnderReview', 'Approved', 'Rejected'], default: 'Pending' },
    resolutionNotes: { type: 'text' },
    student: { type: 'relation', relation: 'manyToOne', target: 'api::student.student' },
    courseOffering: { type: 'relation', relation: 'manyToOne', target: 'api::course-offering.course-offering' }
  }
});

// 6. academic-clearance
createModel('academic-clearance', {
  kind: 'collectionType',
  collectionName: 'academic_clearances',
  info: { singularName: 'academic-clearance', pluralName: 'academic-clearances', displayName: 'Academic Clearance' },
  options: { draftAndPublish: false },
  attributes: {
    status: { type: 'enumeration', enum: ['Eligible', 'Blocked'], default: 'Eligible' },
    reasons: { type: 'json' },
    attendanceRate: { type: 'decimal' },
    creditsEarned: { type: 'integer' },
    failedCoursesCount: { type: 'integer' },
    student: { type: 'relation', relation: 'manyToOne', target: 'api::student.student' }
  }
});

// 7. transcript-version
createModel('transcript-version', {
  kind: 'collectionType',
  collectionName: 'transcript_versions',
  info: { singularName: 'transcript-version', pluralName: 'transcript-versions', displayName: 'Transcript Version' },
  options: { draftAndPublish: false },
  attributes: {
    versionNumber: { type: 'integer', required: true },
    sha256Hash: { type: 'string', required: true },
    qrCodeData: { type: 'string' },
    issuedDate: { type: 'date', required: true },
    reason: { type: 'text' },
    recordStatus: { type: 'enumeration', enum: ['Active', 'Archived'], default: 'Active' },
    student: { type: 'relation', relation: 'manyToOne', target: 'api::student.student' },
    issuedBy: { type: 'relation', relation: 'manyToOne', target: 'plugin::users-permissions.user' }
  }
});

// 8. islamic-extension
createModel('islamic-extension', {
  kind: 'collectionType',
  collectionName: 'islamic_extensions',
  info: { singularName: 'islamic-extension', pluralName: 'islamic-extensions', displayName: 'Islamic Extension' },
  options: { draftAndPublish: false },
  attributes: {
    currentJuz: { type: 'integer' },
    currentSurah: { type: 'string' },
    currentAyah: { type: 'integer' },
    tajweedCompetency: { type: 'enumeration', enum: ['Beginner', 'Intermediate', 'Hafiz', 'Qari'], default: 'Beginner' },
    ijazahEarned: { type: 'boolean', default: false },
    sanadChain: { type: 'text' },
    student: { type: 'relation', relation: 'manyToOne', target: 'api::student.student' }
  }
});

console.log("SUCCESS: All new enterprise schemas generated successfully!");
