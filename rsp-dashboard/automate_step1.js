const fs = require('fs');
const PizZip = require('pizzip');

const files = [
  'Notice to DQ - Higher Teaching.docx',
  'Notice to DQ - No Omnibus.docx',
  'Notice to DQ - Not notarized Omnibus.docx',
  'Notice to DQ.docx',
  'Notice to Qualified - Higher Teaching.docx',
  'Notice to Qualified - Without Date of Assessment.docx'
];

const replacements = [
  // Dates
  { regex: /May 23, 2025/g, tag: "{FormattedDate}" },
  { regex: /JSD\/MPM\/ABQ\/KMJ - 05\/23\/2025/g, tag: "{Remarks}" },
  // Names
  { regex: /RAMI KPOP DEHUNTERS/g, tag: "{ApplicantName}" },
  { regex: /ZOEY KPOP DEHUNTERS/g, tag: "{ApplicantName}" },
  { regex: /MIRA KPOP DEHUNTERS/g, tag: "{ApplicantName}" },
  { regex: /GWI-MA SOUL EATER/g, tag: "{ApplicantName}" },
  // Titles
  { regex: /Madam/g, tag: "{Title}" },
  { regex: /Ma’am/g, tag: "{Title}" },
  // Positions
  { regex: /Teacher III \(Special Science Teacher I\)/g, tag: "{Position}" },
  // App Codes
  { regex: /T3\(SST1\)-DOP-015/g, tag: "{ApplicationCode}" },
  // Address
  { regex: /Iligan City<\/w:t>/g, tag: "{Address}</w:t>" },
  
  // Table: Education
  { regex: /Master’s Degree in relevant strand\/subject/g, tag: "{QSEducation}" },
  { regex: /BA in Sociology/g, tag: "{AppEducation}" },
  { regex: /Bachelor of Secondary Education \(BSED\)/g, tag: "{AppEducation}" },
  // Table: Experience
  { regex: /4 years of relevant teaching\/ industry work experience/g, tag: "{QSExperience}" },
  { regex: /Cash Management and Control System \(24 month\)/g, tag: "{AppExperience}" },
  // Table: Training
  { regex: /12 hours of training relevant to the subject area specialization/g, tag: "{QSTraining}" },
  { regex: /Administrative Aide III \(Clerk I\) - \(1 yr \&amp; 7 mos\)/g, tag: "{AppTraining}" },
  // Table: Eligibility
  { regex: /Ra 1080/g, tag: "{QSEligibility}" },
  { regex: /Honor Graduate Eligibility/g, tag: "{AppEligibility}" },
  
  // DQ Reasons
  { regex: /Pursuant to Section 21 of DO 7 s\. 2023 provides that "Individuals who failed to submit complete mandatory documents \(Items 20\.a to 20\.j\) on the set deadline indicated in the official memorandum shall not be included in the pool of official applicants\.” and upon reviewing your submitted documents, you failed to meet the complete mandatory requirements or qualifications\./g, tag: "{ReasonText}" },
  { regex: /Pursuant to Section 21 of DO 7 s\. 2023 provides that "Individuals who failed to submit complete mandatory documents \(Items 20\.a to 20\.j\) on the set deadline indicated in the official memorandum shall not be included in the pool of official applicants\." and upon reviewing your submitted documents, you failed to meet the complete mandatory requirements or qualifications\./g, tag: "{ReasonText}" },
  { regex: /Pursuant to Section 21 of DO 7 s\. 2023 provides that "Individuals who failed to submit complete mandatory documents \(Items 20\.a to 20\.j\) on the set deadline indicated in the official memorandum shall not be included in the pool of official applicants\.” and upon reviewing your submitted documents, you failed to submit Omnibus Sworn Statement\./g, tag: "{ReasonText}" },
  { regex: /Pursuant to Section 21 of DO 7 s\. 2023 provides that "Individuals who failed to submit complete mandatory documents \(Items 20\.a to 20\.j\) on the set deadline indicated in the official memorandum shall not be included in the pool of official applicants\.” and upon reviewing your submitted documents, your Omnibus Sworn Statement is not notarized\./g, tag: "{ReasonText}" }
];

files.forEach(f => {
  try {
    const data = fs.readFileSync('public/templates/' + f);
    const zip = new PizZip(data);
    let xml = zip.file('word/document.xml').asText();
    
    // Custom logic to handle the Remarks column table cells safely
    // They usually have <w:t>Qualified</w:t> or <w:t>Disqualified</w:t>
    let replaceCount = 0;
    xml = xml.replace(/<w:t>Qualified<\/w:t>/g, () => {
      replaceCount++;
      if(replaceCount === 1) return '<w:t>{RmEducation}</w:t>';
      if(replaceCount === 2) return '<w:t>{RmExperience}</w:t>';
      if(replaceCount === 3) return '<w:t>{RmTraining}</w:t>';
      if(replaceCount === 4) return '<w:t>{RmEligibility}</w:t>';
      return '<w:t>Qualified</w:t>';
    });
    
    replaceCount = 0;
    xml = xml.replace(/<w:t>Disqualified<\/w:t>/g, () => {
      replaceCount++;
      if(replaceCount === 1) return '<w:t>{RmEducation}</w:t>';
      if(replaceCount === 2) return '<w:t>{RmExperience}</w:t>';
      if(replaceCount === 3) return '<w:t>{RmTraining}</w:t>';
      if(replaceCount === 4) return '<w:t>{RmEligibility}</w:t>';
      return '<w:t>Disqualified</w:t>';
    });

    replacements.forEach(r => {
      xml = xml.replace(r.regex, r.tag);
    });

    zip.file('word/document.xml', xml);
    const generated = zip.generate({ type: 'nodebuffer' });
    fs.writeFileSync('public/templates/' + f, generated);
    console.log('Automated tags for ' + f);
  } catch (e) {
    console.log('Error processing ' + f, e);
  }
});
