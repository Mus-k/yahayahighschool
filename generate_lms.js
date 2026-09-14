const fs = require('fs');
const path = require('path');

const apiPath = path.join(__dirname, 'strapicms/src/api');

function createModel(name, schema) {
  const dir = path.join(apiPath, name, 'content-types', name);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'schema.json'), JSON.stringify(schema, null, 2));

  // create controllers, routes, services
  const controllerDir = path.join(apiPath, name, 'controllers');
  fs.mkdirSync(controllerDir, { recursive: true });
  fs.writeFileSync(path.join(controllerDir, `${name}.ts`), `import { factories } from '@strapi/strapi';\n\nexport default factories.createCoreController('api::${name}.${name}');\n`);

  const routeDir = path.join(apiPath, name, 'routes');
  fs.mkdirSync(routeDir, { recursive: true });
  fs.writeFileSync(path.join(routeDir, `${name}.ts`), `import { factories } from '@strapi/strapi';\n\nexport default factories.createCoreRouter('api::${name}.${name}');\n`);

  const serviceDir = path.join(apiPath, name, 'services');
  fs.mkdirSync(serviceDir, { recursive: true });
  fs.writeFileSync(path.join(serviceDir, `${name}.ts`), `import { factories } from '@strapi/strapi';\n\nexport default factories.createCoreService('api::${name}.${name}');\n`);
}

// 1. Subject
createModel('subject', {
  kind: 'collectionType',
  collectionName: 'subjects',
  info: { singularName: 'subject', pluralName: 'subjects', displayName: 'Subject', description: 'Academic Subjects' },
  options: { draftAndPublish: false },
  attributes: {
    name: { type: 'string', required: true },
    code: { type: 'string', required: true, unique: true },
    description: { type: 'text' },
    subjectType: { type: 'enumeration', enum: ['Core', 'Elective', 'Extracurricular'], default: 'Core' },
    activeStatus: { type: 'boolean', default: true },
    color: { type: 'string' },
    icon: { type: 'string' },
    defaultWeeklyHours: { type: 'integer' },
    passingScore: { type: 'integer' },
    creditValue: { type: 'decimal' },
    displayOrder: { type: 'integer' },
    department: { type: 'relation', relation: 'manyToOne', target: 'api::department.department' },
    programs: { type: 'relation', relation: 'manyToMany', target: 'api::program.program' },
    sections: { type: 'relation', relation: 'manyToMany', target: 'api::section.section' },
    teachers: { type: 'relation', relation: 'manyToMany', target: 'api::teacher.teacher' },
    students: { type: 'relation', relation: 'manyToMany', target: 'api::student.student' }
  }
});

// 2. Curriculum
createModel('curriculum', {
  kind: 'collectionType',
  collectionName: 'curriculums',
  info: { singularName: 'curriculum', pluralName: 'curriculums', displayName: 'Curriculum' },
  options: { draftAndPublish: false },
  attributes: {
    title: { type: 'string', required: true },
    version: { type: 'string', required: true },
    description: { type: 'text' },
    objectives: { type: 'text' },
    learningOutcomes: { type: 'text' },
    estimatedDuration: { type: 'string' },
    status: { type: 'enumeration', enum: ['Active', 'Draft', 'Archived'], default: 'Draft' },
    subject: { type: 'relation', relation: 'manyToOne', target: 'api::subject.subject' },
    academicYear: { type: 'relation', relation: 'manyToOne', target: 'api::academic-year.academic-year' },
    program: { type: 'relation', relation: 'manyToOne', target: 'api::program.program' },
    department: { type: 'relation', relation: 'manyToOne', target: 'api::department.department' },
    section: { type: 'relation', relation: 'manyToOne', target: 'api::section.section' },
    topics: { type: 'relation', relation: 'oneToMany', target: 'api::topic.topic', mappedBy: 'curriculum' },
    attachments: { type: 'media', multiple: true, allowedTypes: ['files', 'images', 'videos', 'audios'] }
  }
});

// 3. Topic
createModel('topic', {
  kind: 'collectionType',
  collectionName: 'topics',
  info: { singularName: 'topic', pluralName: 'topics', displayName: 'Topic' },
  options: { draftAndPublish: false },
  attributes: {
    title: { type: 'string', required: true },
    description: { type: 'text' },
    learningObjectives: { type: 'text' },
    estimatedTime: { type: 'string' },
    teachingMethod: { type: 'string' },
    completionStatus: { type: 'enumeration', enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' },
    orderNumber: { type: 'integer' },
    curriculum: { type: 'relation', relation: 'manyToOne', target: 'api::curriculum.curriculum', inversedBy: 'topics' },
    attachments: { type: 'media', multiple: true, allowedTypes: ['files', 'images', 'videos', 'audios'] }
  }
});

// 4. Academic Resource
createModel('academic-resource', {
  kind: 'collectionType',
  collectionName: 'academic_resources',
  info: { singularName: 'academic-resource', pluralName: 'academic-resources', displayName: 'Academic Resource' },
  options: { draftAndPublish: false },
  attributes: {
    title: { type: 'string', required: true },
    category: { type: 'enumeration', enum: ['Document', 'Video', 'Audio', 'Image', 'Archive', 'Link', 'Other'] },
    description: { type: 'text' },
    version: { type: 'string' },
    isShared: { type: 'boolean', default: false },
    file: { type: 'media', multiple: false, allowedTypes: ['files', 'images', 'videos', 'audios'] },
    url: { type: 'string' },
    subject: { type: 'relation', relation: 'manyToOne', target: 'api::subject.subject' },
    department: { type: 'relation', relation: 'manyToOne', target: 'api::department.department' },
    author: { type: 'relation', relation: 'manyToOne', target: 'api::teacher.teacher' }
  }
});

// 5. Classroom
createModel('classroom', {
  kind: 'collectionType',
  collectionName: 'classrooms',
  info: { singularName: 'classroom', pluralName: 'classrooms', displayName: 'Classroom' },
  options: { draftAndPublish: false },
  attributes: {
    name: { type: 'string', required: true },
    code: { type: 'string', required: true, unique: true },
    capacity: { type: 'integer' },
    building: { type: 'string' },
    floor: { type: 'string' },
    roomType: { type: 'enumeration', enum: ['Lecture Room', 'Laboratory', 'Library', 'Auditorium', 'Mosque', 'Gym', 'Other'], default: 'Lecture Room' },
    resources: { type: 'json' },
    status: { type: 'enumeration', enum: ['Active', 'Maintenance', 'Inactive'], default: 'Active' },
    campus: { type: 'relation', relation: 'manyToOne', target: 'api::campus.campus' }
  }
});

// 6. Timetable Slot
createModel('timetable-slot', {
  kind: 'collectionType',
  collectionName: 'timetable_slots',
  info: { singularName: 'timetable-slot', pluralName: 'timetable-slots', displayName: 'Timetable Slot' },
  options: { draftAndPublish: false },
  attributes: {
    dayOfWeek: { type: 'enumeration', enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], required: true },
    startTime: { type: 'time', required: true },
    endTime: { type: 'time', required: true },
    durationMinutes: { type: 'integer' },
    status: { type: 'enumeration', enum: ['Active', 'Cancelled', 'Rescheduled'], default: 'Active' },
    academicYear: { type: 'relation', relation: 'manyToOne', target: 'api::academic-year.academic-year' },
    academicTerm: { type: 'relation', relation: 'manyToOne', target: 'api::academic-term.academic-term' },
    section: { type: 'relation', relation: 'manyToOne', target: 'api::section.section' },
    teacher: { type: 'relation', relation: 'manyToOne', target: 'api::teacher.teacher' },
    subject: { type: 'relation', relation: 'manyToOne', target: 'api::subject.subject' },
    classroom: { type: 'relation', relation: 'manyToOne', target: 'api::classroom.classroom' },
    campus: { type: 'relation', relation: 'manyToOne', target: 'api::campus.campus' }
  }
});

// 7. Academic Calendar Event
createModel('academic-calendar-event', {
  kind: 'collectionType',
  collectionName: 'academic_calendar_events',
  info: { singularName: 'academic-calendar-event', pluralName: 'academic-calendar-events', displayName: 'Academic Calendar Event' },
  options: { draftAndPublish: false },
  attributes: {
    title: { type: 'string', required: true },
    eventType: { type: 'enumeration', enum: ['Holiday', 'Exam', 'Meeting', 'Custom'], default: 'Custom' },
    startDate: { type: 'date', required: true },
    endDate: { type: 'date', required: true },
    description: { type: 'text' },
    academicYear: { type: 'relation', relation: 'manyToOne', target: 'api::academic-year.academic-year' },
    academicTerms: { type: 'relation', relation: 'manyToMany', target: 'api::academic-term.academic-term' }
  }
});

// 8. Lesson Plan
createModel('lesson-plan', {
  kind: 'collectionType',
  collectionName: 'lesson_plans',
  info: { singularName: 'lesson-plan', pluralName: 'lesson-plans', displayName: 'Lesson Plan' },
  options: { draftAndPublish: false },
  attributes: {
    title: { type: 'string', required: true },
    lessonNumber: { type: 'string' },
    objectives: { type: 'text' },
    teachingMethod: { type: 'text' },
    homework: { type: 'text' },
    assessmentMethod: { type: 'text' },
    status: { type: 'enumeration', enum: ['Draft', 'Pending Approval', 'Approved', 'Rejected'], default: 'Draft' },
    teacher: { type: 'relation', relation: 'manyToOne', target: 'api::teacher.teacher' },
    subject: { type: 'relation', relation: 'manyToOne', target: 'api::subject.subject' },
    section: { type: 'relation', relation: 'manyToOne', target: 'api::section.section' },
    curriculum: { type: 'relation', relation: 'manyToOne', target: 'api::curriculum.curriculum' },
    academicYear: { type: 'relation', relation: 'manyToOne', target: 'api::academic-year.academic-year' },
    academicTerm: { type: 'relation', relation: 'manyToOne', target: 'api::academic-term.academic-term' },
    attachments: { type: 'media', multiple: true, allowedTypes: ['files', 'images', 'videos', 'audios'] }
  }
});

// 9. Lesson Delivery
createModel('lesson-delivery', {
  kind: 'collectionType',
  collectionName: 'lesson_deliveries',
  info: { singularName: 'lesson-delivery', pluralName: 'lesson-deliveries', displayName: 'Lesson Delivery' },
  options: { draftAndPublish: false },
  attributes: {
    actualStartTime: { type: 'datetime' },
    actualEndTime: { type: 'datetime' },
    topicsCovered: { type: 'json' },
    teacherReflection: { type: 'text' },
    completionPercentage: { type: 'integer' },
    lessonPlan: { type: 'relation', relation: 'oneToOne', target: 'api::lesson-plan.lesson-plan' },
    attachments: { type: 'media', multiple: true, allowedTypes: ['files', 'images', 'videos', 'audios'] }
  }
});

// 10. Attendance Record
createModel('attendance-record', {
  kind: 'collectionType',
  collectionName: 'attendance_records',
  info: { singularName: 'attendance-record', pluralName: 'attendance-records', displayName: 'Attendance Record' },
  options: { draftAndPublish: false },
  attributes: {
    date: { type: 'date', required: true },
    status: { type: 'enumeration', enum: ['Present', 'Absent', 'Late', 'Excused', 'Medical', 'Holiday', 'Suspended', 'Remote'], required: true },
    comments: { type: 'text' },
    student: { type: 'relation', relation: 'manyToOne', target: 'api::student.student' },
    teacher: { type: 'relation', relation: 'manyToOne', target: 'api::teacher.teacher' }, // who recorded it
    section: { type: 'relation', relation: 'manyToOne', target: 'api::section.section' },
    subject: { type: 'relation', relation: 'manyToOne', target: 'api::subject.subject' },
    academicYear: { type: 'relation', relation: 'manyToOne', target: 'api::academic-year.academic-year' },
    academicTerm: { type: 'relation', relation: 'manyToOne', target: 'api::academic-term.academic-term' }
  }
});

// 11. Homework
createModel('homework', {
  kind: 'collectionType',
  collectionName: 'homeworks',
  info: { singularName: 'homework', pluralName: 'homeworks', displayName: 'Homework' },
  options: { draftAndPublish: false },
  attributes: {
    title: { type: 'string', required: true },
    instructions: { type: 'text' },
    assignedDate: { type: 'datetime', required: true },
    dueDate: { type: 'datetime', required: true },
    maxScore: { type: 'decimal' },
    submissionType: { type: 'enumeration', enum: ['Individual', 'Group'], default: 'Individual' },
    category: { type: 'enumeration', enum: ['Reading', 'Writing', 'Research', 'Project', 'Presentation', 'Practical', 'Memorization', 'Listening', 'Speaking', 'Other'], default: 'Writing' },
    visibility: { type: 'enumeration', enum: ['Draft', 'Published'], default: 'Draft' },
    subject: { type: 'relation', relation: 'manyToOne', target: 'api::subject.subject' },
    teacher: { type: 'relation', relation: 'manyToOne', target: 'api::teacher.teacher' },
    section: { type: 'relation', relation: 'manyToOne', target: 'api::section.section' },
    academicYear: { type: 'relation', relation: 'manyToOne', target: 'api::academic-year.academic-year' },
    academicTerm: { type: 'relation', relation: 'manyToOne', target: 'api::academic-term.academic-term' },
    attachments: { type: 'media', multiple: true, allowedTypes: ['files', 'images', 'videos', 'audios'] }
  }
});

// 12. Homework Submission
createModel('homework-submission', {
  kind: 'collectionType',
  collectionName: 'homework_submissions',
  info: { singularName: 'homework-submission', pluralName: 'homework-submissions', displayName: 'Homework Submission' },
  options: { draftAndPublish: false },
  attributes: {
    submissionDate: { type: 'datetime', required: true },
    isLate: { type: 'boolean', default: false },
    grade: { type: 'decimal' },
    feedback: { type: 'text' },
    textContent: { type: 'text' },
    homework: { type: 'relation', relation: 'manyToOne', target: 'api::homework.homework' },
    student: { type: 'relation', relation: 'manyToOne', target: 'api::student.student' },
    attachments: { type: 'media', multiple: true, allowedTypes: ['files', 'images', 'videos', 'audios'] }
  }
});

// 13. Gradebook Entry
createModel('gradebook-entry', {
  kind: 'collectionType',
  collectionName: 'gradebook_entries',
  info: { singularName: 'gradebook-entry', pluralName: 'gradebook-entries', displayName: 'Gradebook Entry' },
  options: { draftAndPublish: false },
  attributes: {
    assessmentType: { type: 'enumeration', enum: ['Homework', 'Quiz', 'Project', 'Participation', 'Attendance', 'Exam', 'Other'], required: true },
    title: { type: 'string', required: true },
    score: { type: 'decimal', required: true },
    maxScore: { type: 'decimal', required: true },
    percentage: { type: 'decimal' },
    weight: { type: 'decimal' },
    teacherComment: { type: 'text' },
    status: { type: 'enumeration', enum: ['Draft', 'Published'], default: 'Draft' },
    student: { type: 'relation', relation: 'manyToOne', target: 'api::student.student' },
    teacher: { type: 'relation', relation: 'manyToOne', target: 'api::teacher.teacher' },
    subject: { type: 'relation', relation: 'manyToOne', target: 'api::subject.subject' },
    section: { type: 'relation', relation: 'manyToOne', target: 'api::section.section' },
    academicYear: { type: 'relation', relation: 'manyToOne', target: 'api::academic-year.academic-year' },
    academicTerm: { type: 'relation', relation: 'manyToOne', target: 'api::academic-term.academic-term' }
  }
});

console.log('Successfully created 13 LMS Phase 3A Collection Types.');
