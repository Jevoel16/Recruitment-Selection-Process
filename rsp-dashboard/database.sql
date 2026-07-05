CREATE DATABASE IF NOT EXISTS rsp_db;
USE rsp_db;

CREATE TABLE IF NOT EXISTS applicants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    firstName VARCHAR(100) NOT NULL,
    middleName VARCHAR(100) NOT NULL,
    lastName VARCHAR(100) NOT NULL,
    nameExtension VARCHAR(50) DEFAULT NULL,
    applicationType VARCHAR(50) NOT NULL,
    applicationCode VARCHAR(50) DEFAULT NULL,
    district VARCHAR(50) DEFAULT NULL,
    category VARCHAR(50) DEFAULT NULL,
    position VARCHAR(100) DEFAULT NULL,
    status ENUM('PENDING', 'QUALIFIED', 'DISQUALIFIED', 'WAITING_FOR_ASSESSMENT', 'ASSESSED', 'NO_APPEARANCE', 'WAITING', 'ASSIGNED', 'COMPLETED') DEFAULT 'PENDING',
    interviewScore INT DEFAULT NULL,
    
    scoreEducation DOUBLE DEFAULT NULL,
    scoreTraining DOUBLE DEFAULT NULL,
    scoreExperience DOUBLE DEFAULT NULL,
    scorePerformance DOUBLE DEFAULT NULL,
    scoreOutstandingAccomplishments DOUBLE DEFAULT NULL,
    scoreApplicationOfEducation DOUBLE DEFAULT NULL,
    scoreApplicationOfLD DOUBLE DEFAULT NULL,
    scorePotential DOUBLE DEFAULT NULL,
    assessmentTotal DOUBLE DEFAULT NULL,
    assessmentRemarks ENUM('Assessed', 'In-Prog', 'Pending') DEFAULT 'Pending',

    assignedOffice VARCHAR(255) DEFAULT NULL,
    cc VARCHAR(255) DEFAULT NULL,
    ccDesignation VARCHAR(255) DEFAULT NULL,
    
    address TEXT DEFAULT NULL,
    birthdate VARCHAR(20) DEFAULT NULL,
    sex ENUM('Male', 'Female', 'Other') DEFAULT NULL,
    civilStatus VARCHAR(50) DEFAULT NULL,
    religion VARCHAR(100) DEFAULT NULL,
    disability VARCHAR(100) DEFAULT NULL,
    ethnicGroup VARCHAR(100) DEFAULT NULL,
    emailAddress VARCHAR(150) DEFAULT NULL,
    contactNo VARCHAR(50) DEFAULT NULL,
    pdsLink VARCHAR(255) DEFAULT NULL,
    
    req_pds BOOLEAN DEFAULT FALSE,
    req_prcLicense BOOLEAN DEFAULT FALSE,
    req_reportRating BOOLEAN DEFAULT FALSE,
    req_medCert BOOLEAN DEFAULT FALSE,
    req_birthCert BOOLEAN DEFAULT FALSE,
    req_marriageCert BOOLEAN DEFAULT FALSE,
    req_nbiClearance BOOLEAN DEFAULT FALSE,
    req_tor BOOLEAN DEFAULT FALSE,
    req_diplomaBachelors BOOLEAN DEFAULT FALSE,
    req_masters BOOLEAN DEFAULT FALSE,
    req_doctorate BOOLEAN DEFAULT FALSE,
    req_soGraduation BOOLEAN DEFAULT FALSE,
    req_orderSeparation BOOLEAN DEFAULT FALSE,
    req_saln BOOLEAN DEFAULT FALSE,
    assignmentReqStatus ENUM('INCOMPLETE', 'COMPLETE') DEFAULT 'INCOMPLETE',
    disqualificationReason TEXT DEFAULT NULL,
    lockedBy VARCHAR(255) DEFAULT NULL,
    lockedAt DATETIME DEFAULT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_category (category),
    INDEX idx_position (position),
    INDEX idx_assignedOffice (assignedOffice),
    INDEX idx_createdAt (createdAt)
);

CREATE TABLE IF NOT EXISTS applicant_education (
    id INT AUTO_INCREMENT PRIMARY KEY,
    applicant_id INT NOT NULL,
    degree VARCHAR(255) NOT NULL,
    yearGraduated INT NOT NULL,
    digitalCopyLink TEXT NOT NULL,
    is_highest BOOLEAN DEFAULT FALSE,
    status ENUM('PENDING', 'QUALIFIED', 'DISQUALIFIED') DEFAULT 'PENDING',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (applicant_id) REFERENCES applicants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS applicant_training (
    id INT AUTO_INCREMENT PRIMARY KEY,
    applicant_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    hours INT NOT NULL,
    digitalCopyLink TEXT NOT NULL,
    status ENUM('PENDING', 'QUALIFIED', 'DISQUALIFIED') DEFAULT 'PENDING',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (applicant_id) REFERENCES applicants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS applicant_experience (
    id INT AUTO_INCREMENT PRIMARY KEY,
    applicant_id INT NOT NULL,
    details TEXT NOT NULL,
    years INT NOT NULL,
    digitalCopyLink TEXT NOT NULL,
    status ENUM('PENDING', 'QUALIFIED', 'DISQUALIFIED') DEFAULT 'PENDING',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (applicant_id) REFERENCES applicants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS applicant_eligibility (
    id INT AUTO_INCREMENT PRIMARY KEY,
    applicant_id INT NOT NULL,
    details TEXT NOT NULL,
    rating VARCHAR(255) NOT NULL,
    digitalCopyLink TEXT NOT NULL,
    status ENUM('PENDING', 'QUALIFIED', 'DISQUALIFIED') DEFAULT 'PENDING',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (applicant_id) REFERENCES applicants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS positions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    vacancyAnnouncement TEXT DEFAULT NULL,
    plantillaItem TEXT DEFAULT NULL,
    salaryGrade TEXT DEFAULT NULL,
    monthlySalary TEXT DEFAULT NULL,
    qsEducation TEXT DEFAULT NULL,
    qsTraining TEXT DEFAULT NULL,
    qsExperience TEXT DEFAULT NULL,
    qsEligibility TEXT DEFAULT NULL,
    in_vacancy BOOLEAN DEFAULT FALSE,
    vacancyCount INT DEFAULT 1,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
