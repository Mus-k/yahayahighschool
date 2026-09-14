const fs = require('fs');
const path = require('path');

const apis = {
  'language-program': {
    attributes: {
      name: { type: 'string', required: true },
      code: { type: 'string', unique: true, required: true },
      description: { type: 'text' },
      language: { type: 'enumeration', enum: ['Arabic', 'English'], required: true },
      targetLevel: { type: 'string' },
      ageGroup: { type: 'string' },
      durationMonths: { type: 'integer' },
      isActive: { type: 'boolean', default: true },
      teachers: { type: 'relation', relation: 'manyToMany', target: 'api::teacher.teacher' },
      students: { type: 'relation', relation: 'manyToMany', target: 'api::student.student' },
      sections: { type: 'relation', relation: 'manyToMany', target: 'api::section.section' }
    }
  },
  'language-level': {
    attributes: {
      code: { type: 'string', unique: true, required: true },
      name: { type: 'string', required: true },
      expectedCompetencies: { type: 'text' },
      learningOutcomes: { type: 'text' },
      minPassingScore: { type: 'decimal' },
      language_program: { type: 'relation', relation: 'manyToOne', target: 'api::language-program.language-program' }
    }
  },
  'placement-test': {
    attributes: {
      language: { type: 'enumeration', enum: ['Arabic', 'English'], required: true },
      readingScore: { type: 'decimal' },
      writingScore: { type: 'decimal' },
      listeningScore: { type: 'decimal' },
      speakingScore: { type: 'decimal' },
      grammarScore: { type: 'decimal' },
      vocabularyScore: { type: 'decimal' },
      overallScore: { type: 'decimal' },
      recommendedLevel: { type: 'string' },
      teacherNotes: { type: 'text' },
      dateTaken: { type: 'date', required: true },
      student: { type: 'relation', relation: 'manyToOne', target: 'api::student.student' },
      teacher: { type: 'relation', relation: 'manyToOne', target: 'api::teacher.teacher' }
    }
  },
  'skill-assessment': {
    attributes: {
      skillType: { type: 'enumeration', enum: ['Reading', 'Writing', 'Listening', 'Speaking', 'Grammar', 'Vocabulary', 'Conversation', 'Pronunciation', 'Comprehension'], required: true },
      title: { type: 'string', required: true },
      score: { type: 'decimal' },
      maxScore: { type: 'decimal' },
      rubric: { type: 'json' },
      teacherFeedback: { type: 'text' },
      date: { type: 'date', required: true },
      student: { type: 'relation', relation: 'manyToOne', target: 'api::student.student' },
      teacher: { type: 'relation', relation: 'manyToOne', target: 'api::teacher.teacher' },
      language_program: { type: 'relation', relation: 'manyToOne', target: 'api::language-program.language-program' }
    }
  },
  'language-portfolio': {
    attributes: {
      title: { type: 'string', required: true },
      itemType: { type: 'enumeration', enum: ['Writing Sample', 'Reading Record', 'Audio Recording', 'Video Presentation', 'Project', 'Grammar Exercise'] },
      content: { type: 'richtext' },
      attachments: { type: 'media', multiple: true, allowedTypes: ['images', 'files', 'videos', 'audios'] },
      teacherFeedback: { type: 'text' },
      dateAdded: { type: 'date', required: true },
      student: { type: 'relation', relation: 'manyToOne', target: 'api::student.student' },
      teacher: { type: 'relation', relation: 'manyToOne', target: 'api::teacher.teacher' }
    }
  },
  'observation-journal': {
    attributes: {
      participation: { type: 'integer' },
      confidence: { type: 'integer' },
      motivation: { type: 'integer' },
      behavior: { type: 'integer' },
      strengths: { type: 'text' },
      weaknesses: { type: 'text' },
      recommendations: { type: 'text' },
      visibility: { type: 'enumeration', enum: ['Teacher Only', 'Parent', 'Director'], default: 'Teacher Only' },
      date: { type: 'date', required: true },
      student: { type: 'relation', relation: 'manyToOne', target: 'api::student.student' },
      teacher: { type: 'relation', relation: 'manyToOne', target: 'api::teacher.teacher' }
    }
  },
  'language-competition': {
    attributes: {
      title: { type: 'string', required: true },
      category: { type: 'enumeration', enum: ['Debate', 'Speech Contest', 'Essay Competition', 'Reading Competition', 'Spelling Bee', 'Poetry Recitation', 'Translation', 'Storytelling'] },
      date: { type: 'date' },
      judges: { type: 'string' },
      ranking: { type: 'integer' },
      awards: { type: 'string' },
      media: { type: 'media', multiple: true, allowedTypes: ['images', 'videos'] },
      students: { type: 'relation', relation: 'manyToMany', target: 'api::student.student' }
    }
  },
  'language-achievement': {
    attributes: {
      title: { type: 'string', required: true },
      description: { type: 'text' },
      dateEarned: { type: 'date', required: true },
      student: { type: 'relation', relation: 'manyToOne', target: 'api::student.student' }
    }
  },
  'language-certificate': {
    attributes: {
      type: { type: 'enumeration', enum: ['Course Completion', 'Level Completion', 'Reading Excellence', 'Writing Excellence', 'Listening Excellence', 'Speaking Excellence', 'Grammar Excellence', 'Vocabulary Excellence', 'Competition Winner'] },
      issueDate: { type: 'date', required: true },
      status: { type: 'enumeration', enum: ['Draft', 'Issued', 'Revoked'], default: 'Draft' },
      certificateUrl: { type: 'string' },
      student: { type: 'relation', relation: 'manyToOne', target: 'api::student.student' },
      language_program: { type: 'relation', relation: 'manyToOne', target: 'api::language-program.language-program' }
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

console.log('LLMS Schemas generated successfully!');
