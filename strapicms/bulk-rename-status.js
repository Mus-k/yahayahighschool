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
  'quran-certificate'
];

function findSchemas(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findSchemas(filePath, fileList);
    } else if (file === 'schema.json') {
      // Check if it's in our list of affected schemas
      for (const name of schemasToFix) {
        if (filePath.includes(path.sep + name + path.sep)) {
          fileList.push(filePath);
          break;
        }
      }
    }
  }
  return fileList;
}

const allSchemas = findSchemas(path.join(__dirname, 'src', 'api'));
let updatedCount = 0;

for (const schemaPath of allSchemas) {
  try {
    const data = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    if (data && data.attributes && data.attributes.status) {
      console.log(`Renaming status -> recordStatus in ${schemaPath}`);
      
      // Preserve the ordering by creating a new attributes object
      const newAttributes = {};
      for (const key in data.attributes) {
        if (key === 'status') {
          newAttributes.recordStatus = data.attributes.status;
        } else {
          newAttributes[key] = data.attributes[key];
        }
      }
      data.attributes = newAttributes;
      
      fs.writeFileSync(schemaPath, JSON.stringify(data, null, 2) + '\n');
      updatedCount++;
    }
  } catch (err) {
    console.error(`Error processing ${schemaPath}:`, err);
  }
}

console.log(`Successfully renamed status to recordStatus in ${updatedCount} schemas.`);
