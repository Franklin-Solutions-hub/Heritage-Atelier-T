const Database = require('better-sqlite3');
const db = new Database('./heritage_atelier.db', { readonly: true });

try {
  const vendors = db.prepare(`
    SELECT t.*, u.name, u.email, u.phone, u.city, u.created_at as joined
    FROM tailors t JOIN users u ON t.user_id = u.id
  `).all();
  
  for (const v of vendors) {
    try {
      JSON.parse(v.specialties || '[]');
    } catch(e) {
      console.log('JSON Parse failed for user_id:', v.user_id, 'value:', v.specialties);
    }
  }
  console.log("Readonly access successful. Found items:", vendors.length);
} catch(e) {
  console.error("ERROR CAUGHT:", e.message);
}
