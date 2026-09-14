const fs = require('fs');
const path = require('path');

const apis = {
  'quran-program': {
    attributes: {
      name: { type: 'string', required: true },
      code: { type: 'string', unique: true, required: true },
      description: { type: 'text' },
      durationMonths: { type: 'integer' },
      targetJuz: { type: 'integer' },
      ageGroup: { type: 'string' },
      isActive: { type: 'boolean', default: true },
      teachers: { type: 'relation', relation: 'manyToMany', target: 'api::teacher.teacher' },
      students: { type: 'relation', relation: 'manyToMany', target: 'api::student.student' },
      quran_groups: { type: 'relation', relation: 'oneToMany', target: 'api::quran-group.quran-group', mappedBy: 'quran_program' }
    }
  },
  'quran-group': {
    attributes: {
      name: { type: 'string', required: true },
      code: { type: 'string', unique: true },
      capacity: { type: 'integer' },
      meetingSchedule: { type: 'string' },
      location: { type: 'string' },
      isActive: { type: 'boolean', default: true },
      teacher: { type: 'relation', relation: 'manyToOne', target: 'api::teacher.teacher' },
      quran_program: { type: 'relation', relation: 'manyToOne', target: 'api::quran-program.quran-program', inversedBy: 'quran_groups' },
      students: { type: 'relation', relation: 'manyToMany', target: 'api::student.student' },
      memorizations: { type: 'relation', relation: 'oneToMany', target: 'api::memorization.memorization', mappedBy: 'quran_group' }
    }
  },
  'memorization': {
    attributes: {
      juzNumber: { type: 'integer', required: true },
      surah: { type: 'string', required: true },
      startingAyah: { type: 'integer' },
      endingAyah: { type: 'integer' },
      pagesCovered: { type: 'decimal' },
      linesCovered: { type: 'integer' },
      recordType: { type: 'enumeration', enum: ['New', 'Revision', 'Correction', 'Assessment'] },
      status: { type: 'enumeration', enum: ['Completed', 'Needs Revision', 'Partially Memorized'] },
      teacherNotes: { type: 'text' },
      studentReflection: { type: 'text' },
      date: { type: 'date', required: true },
      student: { type: 'relation', relation: 'manyToOne', target: 'api::student.student' },
      teacher: { type: 'relation', relation: 'manyToOne', target: 'api::teacher.teacher' },
      quran_program: { type: 'relation', relation: 'manyToOne', target: 'api::quran-program.quran-program' },
      quran_group: { type: 'relation', relation: 'manyToOne', target: 'api::quran-group.quran-group', inversedBy: 'memorizations' },
      academic_term: { type: 'relation', relation: 'manyToOne', target: 'api::academic-term.academic-term' }
    }
  },
  'murajaah': {
    attributes: {
      assignedPortions: { type: 'text' },
      completedPortions: { type: 'text' },
      revisionScore: { type: 'decimal' },
      mistakesCount: { type: 'integer', default: 0 },
      teacherNotes: { type: 'text' },
      status: { type: 'enumeration', enum: ['Pending', 'In Progress', 'Completed', 'Needs Retest'] },
      dueDate: { type: 'date' },
      completionDate: { type: 'date' },
      student: { type: 'relation', relation: 'manyToOne', target: 'api::student.student' },
      teacher: { type: 'relation', relation: 'manyToOne', target: 'api::teacher.teacher' },
      quran_group: { type: 'relation', relation: 'manyToOne', target: 'api::quran-group.quran-group' }
    }
  },
  'tajweed-evaluation': {
    attributes: {
      makharij: { type: 'integer' },
      sifaat: { type: 'integer' },
      ghunnah: { type: 'integer' },
      madd: { type: 'integer' },
      qalqalah: { type: 'integer' },
      waqf: { type: 'integer' },
      noonSaakin: { type: 'integer' },
      meemSaakin: { type: 'integer' },
      fluency: { type: 'integer' },
      overallScore: { type: 'decimal' },
      teacherComments: { type: 'text' },
      evaluationDate: { type: 'date', required: true },
      student: { type: 'relation', relation: 'manyToOne', target: 'api::student.student' },
      teacher: { type: 'relation', relation: 'manyToOne', target: 'api::teacher.teacher' }
    }
  },
  'halaqah': {
    attributes: {
      topic: { type: 'string', required: true },
      versesCovered: { type: 'string' },
      corrections: { type: 'text' },
      teacherNotes: { type: 'text' },
      date: { type: 'date', required: true },
      teacher: { type: 'relation', relation: 'manyToOne', target: 'api::teacher.teacher' },
      quran_group: { type: 'relation', relation: 'manyToOne', target: 'api::quran-group.quran-group' },
      students: { type: 'relation', relation: 'manyToMany', target: 'api::student.student' }
    }
  },
  'quran-attendance': {
    attributes: {
      date: { type: 'date', required: true },
      status: { type: 'enumeration', enum: ['Present', 'Absent', 'Late', 'Excused'], required: true },
      arrivalTime: { type: 'time' },
      departureTime: { type: 'time' },
      lateReason: { type: 'string' },
      recitationStatus: { type: 'string' },
      participationScore: { type: 'integer' },
      remarks: { type: 'text' },
      student: { type: 'relation', relation: 'manyToOne', target: 'api::student.student' },
      teacher: { type: 'relation', relation: 'manyToOne', target: 'api::teacher.teacher' },
      quran_group: { type: 'relation', relation: 'manyToOne', target: 'api::quran-group.quran-group' },
      academic_term: { type: 'relation', relation: 'manyToOne', target: 'api::academic-term.academic-term' }
    }
  },
  'quran-assessment': {
    attributes: {
      title: { type: 'string', required: true },
      type: { type: 'enumeration', enum: ['Daily Recitation', 'Weekly Test', 'Monthly Test', 'Quarterly Test', 'Half Juz', 'Full Juz', 'Half Hifz', 'Complete Hifz'] },
      portion: { type: 'string' },
      score: { type: 'decimal' },
      maxScore: { type: 'decimal' },
      mistakes: { type: 'integer' },
      comments: { type: 'text' },
      date: { type: 'date', required: true },
      student: { type: 'relation', relation: 'manyToOne', target: 'api::student.student' },
      teacher: { type: 'relation', relation: 'manyToOne', target: 'api::teacher.teacher' },
      quran_group: { type: 'relation', relation: 'manyToOne', target: 'api::quran-group.quran-group' }
    }
  },
  'dawah-activity': {
    attributes: {
      title: { type: 'string', required: true },
      description: { type: 'text' },
      location: { type: 'string' },
      date: { type: 'date', required: true },
      photos: { type: 'media', multiple: true, allowedTypes: ['images'] },
      videos: { type: 'media', multiple: true, allowedTypes: ['videos'] },
      teacher: { type: 'relation', relation: 'manyToOne', target: 'api::teacher.teacher' },
      students: { type: 'relation', relation: 'manyToMany', target: 'api::student.student' }
    }
  },
  'quran-competition': {
    attributes: {
      name: { type: 'string', required: true },
      category: { type: 'string' },
      date: { type: 'date' },
      judges: { type: 'string' },
      ranking: { type: 'integer' },
      awards: { type: 'string' },
      students: { type: 'relation', relation: 'manyToMany', target: 'api::student.student' }
    }
  },
  'quran-achievement': {
    attributes: {
      title: { type: 'string', required: true },
      description: { type: 'text' },
      dateEarned: { type: 'date', required: true },
      student: { type: 'relation', relation: 'manyToOne', target: 'api::student.student' }
    }
  },
  'quran-certificate': {
    attributes: {
      type: { type: 'enumeration', enum: ['Juz Completion', 'Half Quran', 'Full Quran', 'Excellent Memorization', 'Perfect Attendance', 'Outstanding Tajweed', 'Competition Winner'] },
      issueDate: { type: 'date', required: true },
      status: { type: 'enumeration', enum: ['Draft', 'Issued', 'Revoked'], default: 'Draft' },
      certificateUrl: { type: 'string' },
      student: { type: 'relation', relation: 'manyToOne', target: 'api::student.student' },
      quran_program: { type: 'relation', relation: 'manyToOne', target: 'api::quran-program.quran-program' }
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

console.log('QMS Schemas generated successfully!');
