const fs = require('fs');
const path = require('path');

const schemasToFix = [
  'academic-certificate',
  'academic-transcript',
  'academic-year',
  'campus',
  'exam-schedule',
  'exam-session',
  'examination',
  'language-certificate',
  'marks-entry',
  'memorization',
  'murajaah',
  'quran-attendance',
  'quran-certificate',
  'student'
];

schemasToFix.forEach(name => {
  // Try to find the directory for the content type
  // In Strapi, it's usually src/api/<plugin_or_api>/content-types/<name>/schema.json
  // We can just scan the src/api directory recursively
});

function findSchemas(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findSchemas(filePath, fileList);
    } else if (file === 'schema.json') {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const allSchemas = findSchemas(path.join(__dirname, 'src', 'api'));
let updatedCount = 0;

for (const schemaPath of allSchemas) {
  try {
    const data = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    if (data && data.attributes && data.attributes.status && data.options && data.options.draftAndPublish === true) {
      console.log(`Fixing ${schemaPath}`);
      data.options.draftAndPublish = false;
      fs.writeFileSync(schemaPath, JSON.stringify(data, null, 2) + '\n');
      updatedCount++;
    }
  } catch (err) {
    console.error(`Error processing ${schemaPath}:`, err);
  }
}

console.log(`Successfully updated ${updatedCount} schemas to disable draftAndPublish where custom 'status' field exists.`);
