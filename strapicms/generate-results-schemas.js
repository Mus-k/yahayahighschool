const fs = require('fs');
const path = require('path');

const models = {
  'report-template': {
    singularName: 'report-template',
    pluralName: 'report-templates',
    displayName: 'Report Template',
    description: 'Configurable layouts for report cards',
    attributes: {
      name: { type: 'string', required: true },
      layoutType: { type: 'enumeration', enum: ['Primary', 'Secondary', 'Quran', 'Arabic', 'English', 'Boarding', 'Custom'], default: 'Primary' },
      brandingConfig: { type: 'json' },
      signatureConfig: { type: 'json' },
      version: { type: 'integer', default: 1 }
    }
  },
  'student-result': {
    singularName: 'student-result',
    pluralName: 'student-results',
    displayName: 'Student Result',
    description: 'Calculated final outcome for a student per subject',
    attributes: {
      student: { type: 'relation', relation: 'manyToOne', target: 'api::student.student' },
      academic_year: { type: 'relation', relation: 'manyToOne', target: 'api::academic-year.academic-year' },
      academic_term: { type: 'relation', relation: 'manyToOne', target: 'api::academic-term.academic-term' },
      subject: { type: 'relation', relation: 'manyToOne', target: 'api::subject.subject' },
      caTotal: { type: 'decimal' },
      examTotal: { type: 'decimal' },
      overallScore: { type: 'decimal' },
      letterGrade: { type: 'string' },
      gradePoint: { type: 'decimal' },
      teacherComments: { type: 'text' },
      directorComments: { type: 'text' },
      isPass: { type: 'boolean' }
    }
  },
  'report-card': {
    singularName: 'report-card',
    pluralName: 'report-cards',
    displayName: 'Report Card',
    description: 'Final issued report card document',
    attributes: {
      student: { type: 'relation', relation: 'manyToOne', target: 'api::student.student' },
      academic_year: { type: 'relation', relation: 'manyToOne', target: 'api::academic-year.academic-year' },
      academic_term: { type: 'relation', relation: 'manyToOne', target: 'api::academic-term.academic-term' },
      report_template: { type: 'relation', relation: 'manyToOne', target: 'api::report-template.report-template' },
      workflowStatus: { type: 'enumeration', enum: ['Draft', 'DepartmentReview', 'DirectorApproval', 'Published', 'Rejected'], default: 'Draft' },
      dataSnapshot: { type: 'json' },
      issueDate: { type: 'date' },
      verificationQR: { type: 'string', unique: true }
    }
  },
  'student-ranking': {
    singularName: 'student-ranking',
    pluralName: 'student-rankings',
    displayName: 'Student Ranking',
    description: 'Pre-calculated student rankings',
    attributes: {
      student: { type: 'relation', relation: 'manyToOne', target: 'api::student.student' },
      academic_year: { type: 'relation', relation: 'manyToOne', target: 'api::academic-year.academic-year' },
      academic_term: { type: 'relation', relation: 'manyToOne', target: 'api::academic-term.academic-term' },
      rankContext: { type: 'enumeration', enum: ['School', 'Department', 'Section', 'Subject', 'Program'] },
      subject: { type: 'relation', relation: 'manyToOne', target: 'api::subject.subject' },
      rankPosition: { type: 'integer' },
      averageScore: { type: 'decimal' },
      isTied: { type: 'boolean', default: false }
    }
  },
  'promotion-record': {
    singularName: 'promotion-record',
    pluralName: 'promotion-records',
    displayName: 'Promotion Record',
    description: 'Permanent ledger of promotion decisions',
    attributes: {
      student: { type: 'relation', relation: 'manyToOne', target: 'api::student.student' },
      fromYear: { type: 'relation', relation: 'manyToOne', target: 'api::academic-year.academic-year' },
      fromSection: { type: 'relation', relation: 'manyToOne', target: 'api::section.section' },
      toYear: { type: 'relation', relation: 'manyToOne', target: 'api::academic-year.academic-year' },
      toSection: { type: 'relation', relation: 'manyToOne', target: 'api::section.section' },
      decision: { type: 'enumeration', enum: ['Promoted', 'Conditionally Promoted', 'Repeat Class', 'Graduated', 'Transferred', 'Withdrawn'] },
      remarks: { type: 'text' }
    }
  },
  'graduation-record': {
    singularName: 'graduation-record',
    pluralName: 'graduation-records',
    displayName: 'Graduation Record',
    description: 'Tracking for school graduates and alumni transition',
    attributes: {
      student: { type: 'relation', relation: 'oneToOne', target: 'api::student.student' },
      graduationDate: { type: 'date' },
      className: { type: 'string' },
      awards: { type: 'json' },
      finalTranscript: { type: 'relation', relation: 'oneToOne', target: 'api::academic-transcript.academic-transcript' }
    }
  },
  'academic-transcript': {
    singularName: 'academic-transcript',
    pluralName: 'academic-transcripts',
    displayName: 'Academic Transcript',
    description: 'Official school transcripts',
    attributes: {
      student: { type: 'relation', relation: 'manyToOne', target: 'api::student.student' },
      transcriptNumber: { type: 'string', unique: true },
      verificationID: { type: 'string', unique: true },
      dataSnapshot: { type: 'json' },
      issueDate: { type: 'date' },
      status: { type: 'enumeration', enum: ['Draft', 'Published', 'Revoked'], default: 'Draft' }
    }
  },
  'academic-certificate-template': {
    singularName: 'academic-certificate-template',
    pluralName: 'academic-certificate-templates',
    displayName: 'Academic Certificate Template',
    description: 'Global configuration for certificate generation',
    attributes: {
      name: { type: 'string', required: true },
      category: { type: 'enumeration', enum: ['Excellence', 'Graduation', 'Completion', 'Attendance', 'Behavior', 'Custom'] },
      designConfig: { type: 'json' }
    }
  },
  'academic-certificate': {
    singularName: 'academic-certificate',
    pluralName: 'academic-certificates',
    displayName: 'Academic Certificate',
    description: 'Issued certificates linked to students',
    attributes: {
      student: { type: 'relation', relation: 'manyToOne', target: 'api::student.student' },
      template: { type: 'relation', relation: 'manyToOne', target: 'api::academic-certificate-template.academic-certificate-template' },
      serialNumber: { type: 'string', unique: true },
      verificationID: { type: 'string', unique: true },
      achievementName: { type: 'string' },
      issueDate: { type: 'date' },
      status: { type: 'enumeration', enum: ['Valid', 'Revoked'], default: 'Valid' }
    }
  },
  'honor-roll': {
    singularName: 'honor-roll',
    pluralName: 'honor-rolls',
    displayName: 'Honor Roll',
    description: 'Merit lists',
    attributes: {
      name: { type: 'string', required: true },
      academic_year: { type: 'relation', relation: 'manyToOne', target: 'api::academic-year.academic-year' },
      academic_term: { type: 'relation', relation: 'manyToOne', target: 'api::academic-term.academic-term' },
      category: { type: 'enumeration', enum: ["Dean's List", "Principal's List", "Perfect Attendance", "Most Improved", "Custom"] },
      students: { type: 'relation', relation: 'manyToMany', target: 'api::student.student' }
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
  const schema = {
    kind: 'collectionType',
    collectionName: config.pluralName,
    info: {
      singularName: config.singularName,
      pluralName: config.pluralName,
      displayName: config.displayName,
      description: config.description,
    },
    options: {
      draftAndPublish: true,
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
  const routeCode = `import { factories } from '@strapi/strapi';\n\nexport default factories.createCoreRouter('api::${uid}.${uid}');\n`;
  fs.writeFileSync(path.join(routesDir, `${uid}.ts`), routeCode);

  // service
  const serviceCode = `import { factories } from '@strapi/strapi';\n\nexport default factories.createCoreService('api::${uid}.${uid}');\n`;
  fs.writeFileSync(path.join(servicesDir, `${uid}.ts`), serviceCode);

  console.log(`File created: ${path.join(modelDir, '...')}`);
});

console.log('Results & Reporting Schemas generated successfully!');
