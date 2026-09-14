const fs = require('fs');
const path = require('path');

const models = {
  'gpa-configuration': {
    singularName: 'gpa-configuration',
    pluralName: 'gpa-configurations',
    displayName: 'GPA Configuration',
    description: 'Dynamic rules for GPA and credit evaluation',
    attributes: {
      name: { type: 'string', required: true },
      creditCalcMethod: { type: 'enumeration', enum: ['Weighted GPA', 'Unweighted GPA', 'Semester GPA', 'CGPA'], default: 'Weighted GPA' },
      gradeReplacementPolicy: { type: 'string' },
      repeatedCoursePolicy: { type: 'string' },
      transferCreditPolicy: { type: 'string' },
      isActive: { type: 'boolean', default: true }
    }
  },
  'grading-policy': {
    singularName: 'grading-policy',
    pluralName: 'grading-policies',
    displayName: 'Grading Policy',
    description: 'Configurable CA and Exam percentage weight rules',
    attributes: {
      name: { type: 'string', required: true },
      caPercent: { type: 'decimal', default: 40.0 },
      midtermPercent: { type: 'decimal', default: 30.0 },
      finalPercent: { type: 'decimal', default: 30.0 },
      practicalPercent: { type: 'decimal', default: 0.0 },
      attendancePercent: { type: 'decimal', default: 0.0 },
      projectPercent: { type: 'decimal', default: 0.0 }
    }
  },
  'academic-regulation': {
    singularName: 'academic-regulation',
    pluralName: 'academic-regulations',
    displayName: 'Academic Regulation',
    description: 'Enterprise academic regulations and threshold rules',
    attributes: {
      name: { type: 'string', required: true },
      minimumGPA: { type: 'decimal', default: 2.0 },
      maxFailedCredits: { type: 'integer', default: 12 },
      probationRules: { type: 'text' },
      dismissalRules: { type: 'text' },
      maxRepeats: { type: 'integer', default: 2 },
      graduationRequirements: { type: 'json' }
    }
  },
  'exam-timetable': {
    singularName: 'exam-timetable',
    pluralName: 'exam-timetables',
    displayName: 'Exam Timetable',
    description: 'Detailed examination schedules, hall assignments, and invigilator bookings',
    attributes: {
      examDate: { type: 'date' },
      startTime: { type: 'string' },
      duration: { type: 'string' },
      building: { type: 'string' },
      seatCapacity: { type: 'integer' },
      instructions: { type: 'text' },
      course: { type: 'relation', relation: 'manyToOne', target: 'api::subject.subject' },
      exam_room: { type: 'relation', relation: 'manyToOne', target: 'api::exam-room.exam-room' },
      exam_session: { type: 'relation', relation: 'manyToOne', target: 'api::exam-session.exam-session' },
      invigilator: { type: 'relation', relation: 'manyToOne', target: 'api::teacher.teacher' }
    }
  },
  'student-grade': {
    singularName: 'student-grade',
    pluralName: 'student-grades',
    displayName: 'Student Grade',
    description: 'Teacher grade marks with moderation and locking workflow states',
    attributes: {
      marksObtained: { type: 'decimal' },
      maxMarks: { type: 'decimal' },
      weightPercent: { type: 'decimal' },
      isModerated: { type: 'boolean', default: false },
      moderatorRemarks: { type: 'text' },
      status: { type: 'enumeration', enum: ['Draft', 'TeacherSubmitted', 'DepartmentReview', 'RegistrarApproved', 'Published', 'Locked'], default: 'Draft' },
      student: { type: 'relation', relation: 'manyToOne', target: 'api::student.student' },
      teacher: { type: 'relation', relation: 'manyToOne', target: 'api::teacher.teacher' },
      subject: { type: 'relation', relation: 'manyToOne', target: 'api::subject.subject' },
      academic_year: { type: 'relation', relation: 'manyToOne', target: 'api::academic-year.academic-year' },
      academic_term: { type: 'relation', relation: 'manyToOne', target: 'api::academic-term.academic-term' },
      exam_session: { type: 'relation', relation: 'manyToOne', target: 'api::exam-session.exam-session' },
      assessment_category: { type: 'relation', relation: 'manyToOne', target: 'api::assessment-category.assessment-category' }
    }
  },
  'gpa-history': {
    singularName: 'gpa-history',
    pluralName: 'gpa-histories',
    displayName: 'GPA History',
    description: 'Student historical GPA and academic standing records',
    attributes: {
      semesterGPA: { type: 'decimal' },
      cgpa: { type: 'decimal' },
      creditsEarned: { type: 'decimal' },
      creditsAttempted: { type: 'decimal' },
      academicStanding: { type: 'string' },
      student: { type: 'relation', relation: 'manyToOne', target: 'api::student.student' },
      academic_year: { type: 'relation', relation: 'manyToOne', target: 'api::academic-year.academic-year' },
      academic_term: { type: 'relation', relation: 'manyToOne', target: 'api::academic-term.academic-term' }
    }
  },
  'academic-appeal': {
    singularName: 'academic-appeal',
    pluralName: 'academic-appeals',
    displayName: 'Academic Appeal',
    description: 'Grade and transcript appeals submitted by students',
    attributes: {
      appealType: { type: 'enumeration', enum: ['Grade Review', 'Transcript Error', 'Promotion Review', 'Graduation Review', 'Certificate Error'] },
      details: { type: 'text' },
      status: { type: 'enumeration', enum: ['Pending', 'Under Review', 'Approved', 'Rejected'], default: 'Pending' },
      response: { type: 'text' },
      appealDate: { type: 'date' },
      student: { type: 'relation', relation: 'manyToOne', target: 'api::student.student' },
      reviewer: { type: 'relation', relation: 'manyToOne', target: 'api::teacher.teacher' }
    }
  },
  'graduation-clearance': {
    singularName: 'graduation-clearance',
    pluralName: 'graduation-clearances',
    displayName: 'Graduation Clearance',
    description: 'Multi-departmental graduation checklist clearance records',
    attributes: {
      registrarStatus: { type: 'enumeration', enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
      financeStatus: { type: 'enumeration', enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
      hostelStatus: { type: 'enumeration', enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
      libraryStatus: { type: 'enumeration', enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
      transportStatus: { type: 'enumeration', enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
      ictStatus: { type: 'enumeration', enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
      disciplineStatus: { type: 'enumeration', enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
      deanStatus: { type: 'enumeration', enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
      principalStatus: { type: 'enumeration', enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
      status: { type: 'enumeration', enum: ['Pending', 'In Progress', 'Cleared', 'Rejected'], default: 'Pending' },
      clearanceDate: { type: 'date' },
      notes: { type: 'text' },
      student: { type: 'relation', relation: 'manyToOne', target: 'api::student.student' },
      academic_year: { type: 'relation', relation: 'manyToOne', target: 'api::academic-year.academic-year' }
    }
  },
  'academic-calendar': {
    singularName: 'academic-calendar',
    pluralName: 'academic-calendars',
    displayName: 'Academic Calendar',
    description: 'School academic year and term schedule details',
    attributes: {
      name: { type: 'string', required: true },
      registrationStart: { type: 'date' },
      registrationEnd: { type: 'date' },
      dropPeriodStart: { type: 'date' },
      dropPeriodEnd: { type: 'date' },
      examWeekStart: { type: 'date' },
      examWeekEnd: { type: 'date' },
      graduationDate: { type: 'date' },
      holidayStart: { type: 'date' },
      holidayEnd: { type: 'date' },
      academic_year: { type: 'relation', relation: 'manyToOne', target: 'api::academic-year.academic-year' }
    }
  },
  'academic-audit-log': {
    singularName: 'academic-audit-log',
    pluralName: 'academic-audit-logs',
    displayName: 'Academic Audit Log',
    description: 'Enterprise grade logs, approvals, and system audit trail',
    attributes: {
      actor: { type: 'string' },
      action: { type: 'string' },
      entityType: { type: 'string' },
      entityId: { type: 'integer' },
      oldValue: { type: 'json' },
      newValue: { type: 'json' },
      ipAddress: { type: 'string' },
      browser: { type: 'string' },
      reason: { type: 'text' },
      timestamp: { type: 'datetime' }
    }
  },
  'grading-scheme': {
    singularName: 'grading-scheme',
    pluralName: 'grading-schemes',
    displayName: 'Grading Scheme',
    description: 'Updated schema for Grading Scheme container',
    attributes: {
      name: { type: 'string', required: true, unique: true },
      calculationMethod: { type: 'enumeration', enum: ['Percentage', 'Grade Points', 'Weighted Average', 'Rubric Based'] },
      promotionRules: { type: 'text' },
      isActive: { type: 'boolean', default: true },
      version: { type: 'integer', default: 1 },
      grade_bands: { type: 'relation', relation: 'oneToMany', target: 'api::grade-band.grade-band', mappedBy: 'grading_scheme' }
    }
  },
  'grade-band': {
    singularName: 'grade-band',
    pluralName: 'grade-bands',
    displayName: 'Grade Band',
    description: 'Updated grade bands scale maps',
    attributes: {
      minScore: { type: 'decimal', required: true },
      maxScore: { type: 'decimal', required: true },
      letterGrade: { type: 'string' },
      gradePoint: { type: 'decimal' },
      performanceLevel: { type: 'string' },
      color: { type: 'string' },
      isPass: { type: 'boolean', default: true },
      grading_scheme: { type: 'relation', relation: 'manyToOne', target: 'api::grading-scheme.grading-scheme', inversedBy: 'grade_bands' }
    }
  },
  'assessment-category': {
    singularName: 'assessment-category',
    pluralName: 'assessment-categories',
    displayName: 'Assessment Category',
    description: 'Updated assessments weights configuration',
    attributes: {
      name: { type: 'string', unique: true, required: true },
      description: { type: 'text' },
      weightPercent: { type: 'decimal' },
      maxMarks: { type: 'decimal' },
      passingMarks: { type: 'decimal' },
      latePenalty: { type: 'decimal' }
    }
  },
  'exam-session': {
    singularName: 'exam-session',
    pluralName: 'exam-sessions',
    displayName: 'Exam Session',
    description: 'Updated exam session schedules with lock windows',
    attributes: {
      name: { type: 'string', required: true },
      startDate: { type: 'date', required: true },
      endDate: { type: 'date', required: true },
      recordStatus: { type: 'enumeration', enum: ['Upcoming', 'Active', 'Completed'], default: 'Upcoming' },
      academic_year: { type: 'relation', relation: 'manyToOne', target: 'api::academic-year.academic-year' },
      academic_term: { type: 'relation', relation: 'manyToOne', target: 'api::academic-term.academic-term' },
      registrationWindowStart: { type: 'date' },
      registrationWindowEnd: { type: 'date' },
      publicationDate: { type: 'date' },
      lockDate: { type: 'date' }
    }
  },
  'academic-transcript': {
    singularName: 'academic-transcript',
    pluralName: 'academic-transcripts',
    displayName: 'Academic Transcript',
    description: 'Updated transcript ledger records',
    attributes: {
      transcriptNumber: { type: 'string', unique: true },
      verificationID: { type: 'string', unique: true },
      dataSnapshot: { type: 'json' },
      issueDate: { type: 'date' },
      status: { type: 'enumeration', enum: ['Draft', 'Published', 'Revoked'], default: 'Draft' },
      version: { type: 'integer', default: 1 },
      hash: { type: 'string' },
      qrCode: { type: 'string' },
      digitalSignature: { type: 'string' },
      registrar: { type: 'string' },
      principal: { type: 'string' },
      verificationUrl: { type: 'string' },
      student: { type: 'relation', relation: 'manyToOne', target: 'api::student.student' }
    }
  },
  'academic-certificate': {
    singularName: 'academic-certificate',
    pluralName: 'academic-certificates',
    displayName: 'Academic Certificate',
    description: 'Updated student achievements certificates registry',
    attributes: {
      serialNumber: { type: 'string', unique: true },
      verificationID: { type: 'string', unique: true },
      achievementName: { type: 'string' },
      issueDate: { type: 'date' },
      status: { type: 'enumeration', enum: ['Valid', 'Revoked'], default: 'Valid' },
      certificateType: { type: 'enumeration', enum: ['Enrollment Certificate', 'Completion Certificate', 'Bonafide Letter', 'Good Conduct', 'Character Certificate', 'Recommendation Letter', 'Graduation Diploma', 'Transfer Certificate', 'Attendance Letter', 'Visa Support Letter'] },
      verificationHash: { type: 'string' },
      qrCode: { type: 'string' },
      digitalSignature: { type: 'string' },
      student: { type: 'relation', relation: 'manyToOne', target: 'api::student.student' },
      template: { type: 'relation', relation: 'manyToOne', target: 'api::academic-certificate-template.academic-certificate-template' }
    }
  },
  'promotion-record': {
    singularName: 'promotion-record',
    pluralName: 'promotion-records',
    displayName: 'Promotion Record',
    description: 'Updated grade promotion history log',
    attributes: {
      decision: { type: 'enumeration', enum: ['Promoted', 'Conditionally Promoted', 'Repeat Class', 'Graduated', 'Transferred', 'Withdrawn', 'Probation', 'Dismissed'] },
      remarks: { type: 'text' },
      committee: { type: 'string' },
      approvalDate: { type: 'date' },
      student: { type: 'relation', relation: 'manyToOne', target: 'api::student.student' },
      fromYear: { type: 'relation', relation: 'manyToOne', target: 'api::academic-year.academic-year' },
      fromSection: { type: 'relation', relation: 'manyToOne', target: 'api::section.section' },
      toYear: { type: 'relation', relation: 'manyToOne', target: 'api::academic-year.academic-year' },
      toSection: { type: 'relation', relation: 'manyToOne', target: 'api::section.section' }
    }
  },
  'curriculum': {
    singularName: 'curriculum',
    pluralName: 'curriculums',
    displayName: 'Curriculum',
    description: 'Updated curriculum syllabus records',
    attributes: {
      title: { type: 'string', required: true },
      version: { type: 'string', required: true },
      description: { type: 'text' },
      objectives: { type: 'text' },
      learningOutcomes: { type: 'text' },
      estimatedDuration: { type: 'string' },
      recordStatus: { type: 'enumeration', enum: ['Active', 'Draft', 'Archived'], default: 'Draft' },
      subject: { type: 'relation', relation: 'manyToOne', target: 'api::subject.subject' },
      academicYear: { type: 'relation', relation: 'manyToOne', target: 'api::academic-year.academic-year' },
      program: { type: 'relation', relation: 'manyToOne', target: 'api::program.program' },
      department: { type: 'relation', relation: 'manyToOne', target: 'api::department.department' },
      section: { type: 'relation', relation: 'manyToOne', target: 'api::section.section' },
      topics: { type: 'relation', relation: 'oneToMany', target: 'api::topic.topic', mappedBy: 'curriculum' },
      attachments: { type: 'media', multiple: true },
      credits: { type: 'integer', default: 3 },
      prerequisites: { type: 'text' },
      electives: { type: 'text' },
      graduationCredits: { type: 'integer' }
    }
  }
};

const apiDir = path.join(__dirname, 'src', 'api');

Object.entries(models).forEach(([uid, config]) => {
  const modelDir = path.join(apiDir, uid);
  const contentTypesDir = path.join(modelDir, 'content-types', uid);
  const controllersDir = path.join(modelDir, 'controllers');
  const routesDir = path.join(modelDir, 'routes');
  const servicesDir = path.join(modelDir, 'services');

  [contentTypesDir, controllersDir, routesDir, servicesDir].forEach(dir => fs.mkdirSync(dir, { recursive: true }));

  // schema.json
  let tableName = config.pluralName.replace(/-/g, '_');
  if (['academic-transcript', 'academic-certificate', 'promotion-record'].includes(uid)) {
    tableName = config.pluralName;
  }
  const schema = {
    kind: 'collectionType',
    collectionName: tableName,
    info: {
      singularName: config.singularName,
      pluralName: config.pluralName,
      displayName: config.displayName,
      description: config.description,
    },
    options: {
      draftAndPublish: false,
    },
    pluginOptions: {
      i18n: { localized: true },
    },
    attributes: config.attributes,
  };
  fs.writeFileSync(path.join(contentTypesDir, 'schema.json'), JSON.stringify(schema, null, 2));

  // controller
  const controllerCode = `import { factories } from '@strapi/strapi';\n\nexport default factories.createCoreController('api::${uid}.${uid}');\n`;
  fs.writeFileSync(path.join(controllersDir, `${uid}.ts`), controllerCode);

  // route
  const simpleRouteCode = `import { factories } from '@strapi/strapi';\n\nexport default factories.createCoreRouter('api::${uid}.${uid}');\n`;
  fs.writeFileSync(path.join(routesDir, `${uid}.ts`), simpleRouteCode);

  // service
  const serviceCode = `import { factories } from '@strapi/strapi';\n\nexport default factories.createCoreService('api::${uid}.${uid}');\n`;
  fs.writeFileSync(path.join(servicesDir, `${uid}.ts`), serviceCode);

  console.log(`Created/Updated files for API: ${uid}`);
});

console.log('Milestone 1 — Academic schemas generated successfully!');
