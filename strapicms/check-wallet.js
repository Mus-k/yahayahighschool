const Database = require('better-sqlite3');
const db = new Database('C:/Users/pc/YAHAYASCHOOL/strapicms/.tmp/data.db', { readonly: true });
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
const studentTable = tables.find(t => t.name.includes('student'));
if (studentTable) {
  const students = db.prepare(`SELECT * FROM ${studentTable.name}`).all();
  console.log('Students:', students.map(s => ({ id: s.id, firstName: s.first_name, lastName: s.last_name, advanceBalance: s.advance_balance })));
} else {
  console.log('No student table found. Tables:', tables.map(t => t.name).join(', '));
}
db.close();
