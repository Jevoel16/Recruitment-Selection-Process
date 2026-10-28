-- Least-privilege MySQL account for rsp-portal (the internet-facing app).
-- Run once as root:   mysql -u root -p < deploy/portal-db-user.sql
-- Then set DB_USER=rsp_portal and DB_PASSWORD=<the password below> in rsp-portal/.env.
--
-- The portal can only add new applications. It cannot read applicant details,
-- scores, users or logs, and cannot delete anything, so a compromised portal
-- cannot leak or damage the RSP process data.

-- Change this password before running.
CREATE USER IF NOT EXISTS 'rsp_portal'@'localhost' IDENTIFIED BY 'change-me-portal-password';

-- applicants: insert new rows; read only id/applicationCode (to number tracking codes);
-- update only applicationCode.
GRANT INSERT ON rsp_db.applicants TO 'rsp_portal'@'localhost';
GRANT SELECT (id, applicationCode) ON rsp_db.applicants TO 'rsp_portal'@'localhost';
GRANT UPDATE (applicationCode) ON rsp_db.applicants TO 'rsp_portal'@'localhost';

-- Supporting records submitted with the application form.
GRANT INSERT ON rsp_db.applicant_education TO 'rsp_portal'@'localhost';
GRANT INSERT ON rsp_db.applicant_training TO 'rsp_portal'@'localhost';
GRANT INSERT ON rsp_db.applicant_experience TO 'rsp_portal'@'localhost';
GRANT INSERT ON rsp_db.applicant_eligibility TO 'rsp_portal'@'localhost';

FLUSH PRIVILEGES;
