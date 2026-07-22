const db = require('./db');
db.query("ALTER TABLE applicants MODIFY COLUMN status ENUM('PENDING','QUALIFIED','DISQUALIFIED','DISQUALIFIED_ARCHIVED','WAITING_FOR_ASSESSMENT','ASSESSED','NO_APPEARANCE','NEWLY_PROMOTED','WAITING','ASSIGNED','COMPLETED') DEFAULT 'PENDING'")
  .then(() => console.log('Altered successfully'))
  .then(() => process.exit(0))
  .catch(console.error);
