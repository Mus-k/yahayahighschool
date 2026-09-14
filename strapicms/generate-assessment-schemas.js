const fs = require('fs');
const path = require('path');

const apis = {
  'assessment-category': {
    attributes: {
      name: { type: 'string', unique: true, required: true },
      description: { type: 'text' }
    }
  },
  'assessment-type': {
    attributes: {
      name: { type: 'string', required: true },
      code: { type: 'string', unique: true, required: true },
      weight: { type: 'decimal' },
      passingScore: { type: 'decimal' },
      isActive: { type: 'boolean', default: true },
      assessment_category: { type: 'relation', relation: 'manyToOne', target: 'api::assessment-category.assessment-category' }
    }
  },
  'grading-scheme': {
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
  'rubric': {
    attributes: {
      criteria: { type: 'string', required: true },
      description: { type: 'text' },
      maxPoints: { type: 'decimal' },
      levels: { type: 'json' }
    }
  },
  'exam-session': {
    attributes: {
      name: { type: 'string', required: true },
      startDate: { type: 'date', required: true },
      endDate: { type: 'date', required: true },
      status: { type: 'enumeration', enum: ['Upcoming', 'Active', 'Completed'], default: 'Upcoming' },
      academic_year: { type: 'relation', relation: 'manyToOne', target: 'api::academic-year.academic-year' },
      academic_term: { type: 'relation', relation: 'manyToOne', target: 'api::academic-term.academic-term' }
    }
  },
  'examination': {
    attributes: {
      title: { type: 'string', required: true },
      durationMinutes: { type: 'integer' },
      totalMarks: { type: 'decimal', required: true },
      passingScore: { type: 'decimal' },
      examDate: { type: 'date' },
      instructions: { type: 'text' },
      status: { type: 'enumeration', enum: ['Draft', 'Published', 'Completed'], default: 'Draft' },
      subject: { type: 'relation', relation: 'manyToOne', target: 'api::subject.subject' },
      teacher: { type: 'relation', relation: 'manyToOne', target: 'api::teacher.teacher' },
      section: { type: 'relation', relation: 'manyToOne', target: 'api::section.section' },
      assessment_type: { type: 'relation', relation: 'manyToOne', target: 'api::assessment-type.assessment-type' },
      exam_session: { type: 'relation', relation: 'manyToOne', target: 'api::exam-session.exam-session' }
    }
  },
  'question-pool': {
    attributes: {
      name: { type: 'string', required: true },
      description: { type: 'text' }
    }
  },
  'question': {
    attributes: {
      text: { type: 'text', required: true },
      type: { type: 'enumeration', enum: ['MCQ', 'True/False', 'Short Answer', 'Essay', 'Practical', 'Oral', 'Other'] },
      difficulty: { type: 'enumeration', enum: ['Easy', 'Medium', 'Hard'] },
      marks: { type: 'decimal' },
      correctAnswer: { type: 'text' },
      explanation: { type: 'text' },
      tags: { type: 'json' },
      subject: { type: 'relation', relation: 'manyToOne', target: 'api::subject.subject' },
      question_pool: { type: 'relation', relation: 'manyToOne', target: 'api::question-pool.question-pool' }
    }
  },
  'exam-room': {
    attributes: {
      name: { type: 'string', required: true },
      capacity: { type: 'integer' },
      building: { type: 'string' },
      floor: { type: 'string' }
    }
  },
  'exam-schedule': {
    attributes: {
      startTime: { type: 'datetime', required: true },
      endTime: { type: 'datetime', required: true },
      status: { type: 'enumeration', enum: ['Scheduled', 'InProgress', 'Completed', 'Cancelled'], default: 'Scheduled' },
      examination: { type: 'relation', relation: 'manyToOne', target: 'api::examination.examination' },
      exam_room: { type: 'relation', relation: 'manyToOne', target: 'api::exam-room.exam-room' },
      invigilators: { type: 'relation', relation: 'manyToMany', target: 'api::teacher.teacher' }
    }
  },
  'marks-entry': {
    attributes: {
      rawScore: { type: 'decimal' },
      percentage: { type: 'decimal' },
      gradePoint: { type: 'decimal' },
      teacherNotes: { type: 'text' },
      status: { type: 'enumeration', enum: ['Draft', 'Submitted', 'Approved'], default: 'Draft' },
      student: { type: 'relation', relation: 'manyToOne', target: 'api::student.student' },
      examination: { type: 'relation', relation: 'manyToOne', target: 'api::examination.examination' },
      teacher: { type: 'relation', relation: 'manyToOne', target: 'api::teacher.teacher' },
      grading_scheme: { type: 'relation', relation: 'manyToOne', target: 'api::grading-scheme.grading-scheme' }
    }
  },
  'grade-moderation': {
    attributes: {
      workflowStatus: { type: 'enumeration', enum: ['Submitted', 'DepartmentReview', 'Approved', 'Rejected'], default: 'Submitted' },
      comments: { type: 'text' },
      examination: { type: 'relation', relation: 'manyToOne', target: 'api::examination.examination' },
      submittedBy: { type: 'relation', relation: 'manyToOne', target: 'api::teacher.teacher' },
      approvedBy: { type: 'relation', relation: 'manyToOne', target: 'api::teacher.teacher' }
    }
  }
};

const apiDir = path.join(__dirname, 'src', 'api');

for (const [apiName, schema] of Object.entries(apis)) {
  const modelDir = path.join(apiDir, apiName);
  const contentTypesDir = path.join(modelDir, 'content-types', apiName);
  const controllersDir = path.join(modelDir, 'controllers');
  const routesDir = path.join(modelDir, 'routes');
  const servicesDir = path.join(modelDir, 'services');

  fs.mkdirSync(contentTypesDir, { recursive: true });
  fs.mkdirSync(controllersDir, { recursive: true });
  fs.mkdirSync(routesDir, { recursive: true });
  fs.mkdirSync(servicesDir, { recursive: true });

  const singularName = apiName;
  const pluralName = apiName.endsWith('y') ? apiName.slice(0, -1) + 'ies' : apiName + 's';
  const displayName = apiName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const schemaJson = {
    kind: 'collectionType',
    collectionName: pluralName.replace(/-/g, '_'),
    info: {
      singularName: singularName,
      pluralName: pluralName,
      displayName: displayName,
      description: `Schema for ${displayName}`
    },
    options: { draftAndPublish: true },
    pluginOptions: {},
    attributes: schema.attributes
  };

  fs.writeFileSync(path.join(contentTypesDir, 'schema.json'), JSON.stringify(schemaJson, null, 2));

  fs.writeFileSync(path.join(controllersDir, `${apiName}.ts`), `import { factories } from '@strapi/strapi';\n\nexport default factories.createCoreController('api::${apiName}.${apiName}');`);
  fs.writeFileSync(path.join(routesDir, `${apiName}.ts`), `import { factories } from '@strapi/strapi';\n\nexport default factories.createCoreRouter('api::${apiName}.${apiName}');`);
  fs.writeFileSync(path.join(servicesDir, `${apiName}.ts`), `import { factories } from '@strapi/strapi';\n\nexport default factories.createCoreService('api::${apiName}.${apiName}');`);
}

console.log('Assessment Schemas generated successfully!');
