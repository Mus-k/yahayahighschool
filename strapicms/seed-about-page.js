const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.resolve(__dirname, '.tmp/data.db'));

console.log('[Seed] Seeding About Us into [F] Page...');

db.prepare('DELETE FROM pages WHERE slug = ?').run('about');

// Insert new About Us page
const insertPage = db.prepare(`
  INSERT INTO pages (document_id, title, slug, breadcrumb_title, locale, created_at, updated_at, published_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const now = new Date().toISOString();
const docIdEn = 'abtpage00000000000000000';

const pageResEn = insertPage.run(docIdEn, 'About Us', 'about', 'Empowering Minds, Enriching Souls', 'en', now, now, now);
const pageIdEn = pageResEn.lastInsertRowid;

console.log(`[Seed] Created About Us page (ID ${pageIdEn})`);

function linkComponent(pageId, type, order) {
  let table = type.replace('sections.', 'components_sections_').replace(/-/g, '_') + 's';
  if (type === 'sections.about-intro') table = 'components_sections_about_intros';
  if (type === 'sections.about-mission-vision') table = 'components_sections_about_mission_visions';
  if (type === 'sections.about-values') table = 'components_sections_about_values';
  if (type === 'sections.about-director') table = 'components_sections_about_directors';
  if (type === 'sections.about-why-choose') table = 'components_sections_about_why_chooses';
  if (type === 'sections.about-timeline') table = 'components_sections_about_timelines';
  if (type === 'sections.about-certificates') table = 'components_sections_about_certificates';

  const row = db.prepare(`SELECT id FROM ${table} ORDER BY id DESC LIMIT 1`).get();
  if (row) {
    db.prepare(`
      INSERT INTO pages_cmps (entity_id, cmp_id, component_type, field, "order")
      VALUES (?, ?, ?, 'sections', ?)
    `).run(pageId, row.id, type, order);
    console.log(`[Seed] Linked ${type} (ID ${row.id}) to page ${pageId}`);
  } else {
    console.log(`[Seed] WARNING: No data found for ${type}`);
  }
}

linkComponent(pageIdEn, 'sections.about-intro', 1);
linkComponent(pageIdEn, 'sections.about-mission-vision', 2);
linkComponent(pageIdEn, 'sections.about-values', 3);
linkComponent(pageIdEn, 'sections.about-director', 4);
linkComponent(pageIdEn, 'sections.about-why-choose', 5);
linkComponent(pageIdEn, 'sections.about-timeline', 6);
linkComponent(pageIdEn, 'sections.about-certificates', 7);

console.log('[Seed] Done!');
db.close();
