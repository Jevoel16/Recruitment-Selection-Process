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
    vacancyAnnouncementNo INT DEFAULT NULL,
    status ENUM('PENDING', 'QUALIFIED', 'DISQUALIFIED', 'WAITING_FOR_ASSESSMENT', 'ASSESSED', 'NO_APPEARANCE', 'NEWLY_PROMOTED', 'WAITING', 'ASSIGNED', 'COMPLETED') DEFAULT 'PENDING',
    interviewScore INT DEFAULT NULL,
    
    scoreEducation DOUBLE DEFAULT NULL,
    scoreTraining DOUBLE DEFAULT NULL,
    scoreExperience DOUBLE DEFAULT NULL,
    scorePerformance DOUBLE DEFAULT NULL,
    scoreOutstandingAccomplishments DOUBLE DEFAULT NULL,
    scoreApplicationOfEducation DOUBLE DEFAULT NULL,
    scoreApplicationOfLD DOUBLE DEFAULT NULL,
    scorePotential DOUBLE DEFAULT NULL,
    scorePbet DECIMAL(5,2) DEFAULT NULL,
    scorePpstCoi DECIMAL(5,2) DEFAULT NULL,
    scorePpstNcoi DECIMAL(5,2) DEFAULT NULL,
    
    scoreWe DECIMAL(5,2) DEFAULT NULL,
    scoreSwst DECIMAL(5,2) DEFAULT NULL,
    scoreBei DECIMAL(5,2) DEFAULT NULL,
    scorePotPa DECIMAL(5,2) DEFAULT NULL,
    scorePotPsa DECIMAL(5,2) DEFAULT NULL,
    
    maxWe DECIMAL(5,2) DEFAULT NULL,
    maxSwst DECIMAL(5,2) DEFAULT NULL,
    maxBei DECIMAL(5,2) DEFAULT NULL,
    maxPotPa DECIMAL(5,2) DEFAULT NULL,
    maxPotPsa DECIMAL(5,2) DEFAULT NULL,
    assessmentTotal DOUBLE DEFAULT NULL,
    assessmentRemarks ENUM('Assessed', 'In-Prog', 'Pending') DEFAULT 'Pending',
    remarks TEXT DEFAULT NULL,
    doc_dates TEXT DEFAULT NULL,

    assignedOffice VARCHAR(255) DEFAULT NULL,
    cc VARCHAR(255) DEFAULT NULL,
    ccDesignation VARCHAR(255) DEFAULT NULL,
    cc_2 VARCHAR(255) DEFAULT NULL,
    ccDesignation_2 VARCHAR(255) DEFAULT NULL,
    cc_3 VARCHAR(255) DEFAULT NULL,
    ccDesignation_3 VARCHAR(255) DEFAULT NULL,
    cc_4 VARCHAR(255) DEFAULT NULL,
    ccDesignation_4 VARCHAR(255) DEFAULT NULL,
    appointmentEffectivity VARCHAR(100) DEFAULT NULL,
    
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
    
    req_pds BOOLEAN DEFAULT TRUE,
    req_prcLicense BOOLEAN DEFAULT TRUE,
    req_reportRating BOOLEAN DEFAULT TRUE,
    req_medCert BOOLEAN DEFAULT TRUE,
    req_birthCert BOOLEAN DEFAULT TRUE,
    req_marriageCert BOOLEAN DEFAULT TRUE,
    req_nbiClearance BOOLEAN DEFAULT TRUE,
    req_tor BOOLEAN DEFAULT TRUE,
    req_diplomaBachelors BOOLEAN DEFAULT TRUE,
    req_masters BOOLEAN DEFAULT TRUE,
    req_doctorate BOOLEAN DEFAULT TRUE,
    req_soGraduation BOOLEAN DEFAULT TRUE,
    req_orderSeparation BOOLEAN DEFAULT TRUE,
    req_saln BOOLEAN DEFAULT TRUE,
    req_folders BOOLEAN DEFAULT TRUE,
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
    months INT DEFAULT 0,
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
    position_code VARCHAR(50) DEFAULT NULL,
    category VARCHAR(100) NOT NULL,
    groupName VARCHAR(255) DEFAULT NULL,
    title VARCHAR(255) NOT NULL,
    vacancyAnnouncementNo INT DEFAULT NULL,
    plantillaItem TEXT DEFAULT NULL,
    salaryGrade TEXT DEFAULT NULL,
    monthlySalary TEXT DEFAULT NULL,
    qsEducation TEXT DEFAULT NULL,
    qsEducationLevel INT DEFAULT NULL,
    qsTraining TEXT DEFAULT NULL,
    qsTrainingLevel INT DEFAULT NULL,
    qsExperience TEXT DEFAULT NULL,
    qsExperienceLevel INT DEFAULT NULL,
    qsEligibility TEXT DEFAULT NULL,
    qsCompetency TEXT DEFAULT NULL,
    in_vacancy BOOLEAN DEFAULT FALSE,
    vacancyCount INT DEFAULT 1,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'evaluator', 'superadmin') DEFAULT 'evaluator',
    can_access_step2 BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(255) NOT NULL,
    target VARCHAR(255) DEFAULT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
