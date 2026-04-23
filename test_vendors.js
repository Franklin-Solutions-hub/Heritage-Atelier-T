const db = require('./server/database/db');
try {
  const vendors = db.prepare(`
    SELECT t.*, u.name, u.email, u.phone, u.city, u.created_at as joined
    FROM tailors t JOIN users u ON t.user_id = u.id
    WHERE 1=1
    ORDER BY u.created_at DESC
  `).all();
  
  const parsed = vendors.map(v => ({
    ...v,
    specialties: JSON.parse(v.specialties || '[]')
  }));
  
  console.log("SUCCESS. Found", parsed.length);
} catch(e) {
  console.error("ERROR CAUGHT:", e.message);
}
